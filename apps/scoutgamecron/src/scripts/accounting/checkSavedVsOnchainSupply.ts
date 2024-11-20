import { log } from "@charmverse/core/log";
import { prisma } from "@charmverse/core/prisma-client";
import { builderContractReadonlyApiClient } from "@packages/scoutgame/builderNfts/clients/builderContractReadClient";
import path from "node:path";
import fs from "node:fs"
import { validateMint } from "@packages/scoutgame/builderNfts/validateMint";
import { builderNftChain } from "@packages/scoutgame/builderNfts/constants";

async function checkSavedVsOnchainSupply() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      tokenId: {
        // Start from first non team Member NFT
        // gte: 9
        // Continue where we left off
        gte: 20
      }
    },
    include: {
      nftSoldEvents: {
        orderBy: {
          createdAt: 'desc'
        },
      },
     builder: true
    },
    orderBy: {
      tokenId: 'asc'
    }
  });

  const tokenDiffDir = path.resolve('token-diffs')

  try {
    fs.readdirSync(tokenDiffDir)
  } catch {
    fs.mkdirSync(tokenDiffDir)
  }

  for (let i = 0; i < builderNfts.length; i++) {

    const nft = builderNfts[i];

    log.info(`Checking tokenId ${nft.tokenId}  (${i + 1} / ${builderNfts.length})`)

    const tokenId = nft.tokenId;

    const totalSold = nft.nftSoldEvents.reduce((acc, val) => acc + val.tokensPurchased, 0);

    const actual = await builderContractReadonlyApiClient.totalSupply({args: {tokenId: BigInt(tokenId)}});

    if (Number(actual) !== totalSold) {
      log.error(`Token ${tokenId} // ${nft.builder.path} error: Onchain supply ${actual} vs saved ${totalSold}`);
    }

    log.info(`Validating ${nft.nftSoldEvents.length} events`)

    let invalidTransactions: {id: string; txHash: string}[] = [];

    for (const purchaseEvent of nft.nftSoldEvents) {
      const validatedMint = await validateMint({
        chainId: builderNftChain.id,
        txHash: purchaseEvent.txHash
      });

      if (!validatedMint) {
        log.error(`Tx ${purchaseEvent.txHash} with ${purchaseEvent.tokensPurchased} tokens is not a valid mint`)
        invalidTransactions.push({
          id: purchaseEvent.id,
          txHash: purchaseEvent.txHash
        })
      }
    }

    if (invalidTransactions.length || Number(actual) !== totalSold) {
      log.error(`Token ${tokenId} // ${nft.builder.path} error: Onchain supply ${actual} vs saved ${totalSold}, ${invalidTransactions.length} invalid txs`);
      fs.writeFileSync(path.join(tokenDiffDir, `tokenId-${tokenId}.json`), JSON.stringify({
        nft,
        stats: {
          onchain: actual,
          recorded: totalSold,
          diff: totalSold - Number(actual),
          invalidTransactions
        }
      }, null, 2))
    }
        
  }

}

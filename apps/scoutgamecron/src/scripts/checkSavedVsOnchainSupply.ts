import { log } from "@charmverse/core/log";
import { prisma } from "@charmverse/core/prisma-client";
import { builderContractReadonlyApiClient } from "@packages/scoutgame/builderNfts/clients/builderContractReadClient";
import path from "node:path";
import fs from "node:fs"

async function checkSavedVsOnchainSupply() {
  const builderNfts = await prisma.builderNft.findMany({
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

    const tokenId = nft.tokenId;

    log.info(`Processing tokenId ${tokenId} for builder ${nft.builderId}`)

    const totalSold = nft.nftSoldEvents.reduce((acc, val) => acc + val.tokensPurchased, 0);

    const actual = await builderContractReadonlyApiClient.totalSupply({args: {tokenId: BigInt(tokenId)}});

    if (Number(actual) !== totalSold) {

      fs.writeFileSync(path.join(tokenDiffDir, `tokenId-${tokenId}.json`), JSON.stringify({
        nft,
        stats: {
          onchain: actual,
          recorded: totalSold,
          diff: totalSold - Number(actual)
        }
      }, null, 2))
      
      log.error(`Token ${tokenId} // ${nft.builder.path} error: Onchain supply ${actual} vs saved ${totalSold}`)
    }

  }

}


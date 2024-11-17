import { log } from "@charmverse/core/log";
import { prisma } from "@charmverse/core/prisma-client";
import { startBlockNumber } from "@packages/scoutgame/builderNfts/accounting/constants";
import { BuilderScoutedEvent, getBuilderScoutedEvents } from "@packages/scoutgame/builderNfts/accounting/getBuilderScoutedEvents";
import { TransferSingleEvent, getTransferSingleEvents } from "@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents";
import { builderContractReadonlyApiClient } from "@packages/scoutgame/builderNfts/clients/builderContractReadClient";
import { recordNftMint } from "@packages/scoutgame/builderNfts/recordNftMint";
import { convertCostToPoints } from "@packages/scoutgame/builderNfts/utils";
import fs from 'node:fs';
import path from "node:path";



export async function findMissingPurchases() {
  const builderScoutedEvents = await getBuilderScoutedEvents({fromBlock: startBlockNumber});
  const transferSingleEvents = await getTransferSingleEvents({fromBlock: startBlockNumber}).then(events => events.reduce((acc, val) => {

    acc[val.transactionHash] = val;

    return acc;
  }, {} as Record<string, TransferSingleEvent>));

  const missingEvents: typeof builderScoutedEvents = [];

  const uniqueTxHashes = await prisma.nFTPurchaseEvent.groupBy({
    by: ['txHash']
  }).then(transactions => new Set(transactions.map(tx => tx.txHash)));

  for (const event of builderScoutedEvents) {
    if (!uniqueTxHashes.has(event.transactionHash)) {
      missingEvents.push(event)
    }
  }


  console.log('Onchain events', builderScoutedEvents.length)
  console.log('Saved events', uniqueTxHashes.size)
  console.log('Missing events', missingEvents.length);


  const jsonData = fs.readdirSync(path.resolve('token-diffs'));

  const files = jsonData.filter(elem => elem.match(/\d/)).map(elem => parseInt(elem.split('tokenId-')[1].replace('.json', ''))).sort((a, b) => a - b)


  const groupedByTokenId = missingEvents.reduce((acc, val) => {
    const tokenId = Number(val.args.tokenId);
    if (!acc[tokenId]) {
      acc[tokenId] = {records: [], hasJson: files.includes(tokenId) };
    }

    acc[tokenId].records.push(val);

    return acc;

  }, {} as Record<number, {records: BuilderScoutedEvent[], hasJson: boolean}>);

  const allTokenIdsAsString = Object.keys(groupedByTokenId).filter((_tokenId) => _tokenId !== "163")

  const nfts = await prisma.builderNft.findMany({
    where: {
      tokenId: {
        in: allTokenIdsAsString.map(key => Number(key))
      }
    }
  })

  for (const key of allTokenIdsAsString) {
    for (const missingTx of groupedByTokenId[key as any].records) {
      console.log('Missing tx', missingTx.transactionHash, 'tokenId', key)

      const matchingNft = nfts.find(nft => nft.tokenId === Number(key));

      if (!matchingNft) {
        log.error(`NFT with tokenId ${key} not found`)
        continue;
      }

      const price = await builderContractReadonlyApiClient.getTokenPurchasePrice({args: {tokenId: BigInt(key), amount: BigInt(missingTx.args.amount)}, blockNumber: missingTx.blockNumber});

      const asPoints = convertCostToPoints(price);

      const address = transferSingleEvents[missingTx.transactionHash].args.to;

      if (!address) {
        log.error(`Tx ${missingTx.transactionHash} has no recipient address`)
      }

      await recordNftMint({
        amount: Number(missingTx.args.amount),
        scoutId: missingTx.args.scout,
        mintTxHash: missingTx.transactionHash,
        paidWithPoints: false,
        pointsValue:asPoints,
        builderNftId: matchingNft.id,
        recipientAddress: address
      })
    }
  }
}

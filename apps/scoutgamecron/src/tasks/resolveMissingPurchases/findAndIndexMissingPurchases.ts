import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import type { BuilderScoutedEvent } from '@packages/scoutgame/builderNfts/accounting/getBuilderScoutedEvents';
import {
  getBuilderScoutedEvents,
  getBuilderStarterPackScoutedEvents
} from '@packages/scoutgame/builderNfts/accounting/getBuilderScoutedEvents';
import type { TransferSingleEvent } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import {
  getStarterPackTransferSingleEvents,
  getTransferSingleEvents
} from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { builderContractStarterPackReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractStarterPackReadClient';
import { recordNftMint } from '@packages/scoutgame/builderNfts/recordNftMint';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';

// Start block number for refetching events - Nov.14th 2024 - Last manual reindexing was Nov. 17th 2024
const startBlockNumberForReindexing = 128000000;

export async function findAndIndexMissingPurchases() {
  const builderScoutedEvents = await getBuilderScoutedEvents({ fromBlock: startBlockNumberForReindexing });
  const transferSingleEvents = await getTransferSingleEvents({ fromBlock: startBlockNumberForReindexing }).then(
    (events) =>
      events.reduce(
        (acc, val) => {
          acc[val.transactionHash] = val;

          return acc;
        },
        {} as Record<string, TransferSingleEvent>
      )
  );

  const missingEvents: typeof builderScoutedEvents = [];

  const uniqueTxHashes = await prisma.nFTPurchaseEvent
    .groupBy({
      by: ['txHash']
    })
    .then((transactions) => new Set(transactions.map((tx) => tx.txHash)));

  for (const event of builderScoutedEvents) {
    if (!uniqueTxHashes.has(event.transactionHash)) {
      missingEvents.push(event);
    }
  }

  // Early exit
  if (!missingEvents.length) {
    scoutgameMintsLogger.info('No missing events found');
    return;
  }

  scoutgameMintsLogger.error(`Found ${missingEvents.length} missing events`);

  const groupedByTokenId = missingEvents.reduce(
    (acc, val) => {
      const tokenId = Number(val.args.tokenId);

      if (!acc[tokenId]) {
        acc[tokenId] = { records: [] };
      }

      acc[tokenId].records.push(val);

      return acc;
    },
    {} as Record<number, { records: BuilderScoutedEvent[] }>
  );

  const allTokenIdsAsString = Object.keys(groupedByTokenId).filter((_tokenId) => _tokenId !== '163');

  const nfts = await prisma.builderNft.findMany({
    where: {
      tokenId: {
        in: allTokenIdsAsString.map((key) => Number(key))
      },
      nftType: BuilderNftType.default
    }
  });

  for (const key of allTokenIdsAsString) {
    for (const missingTx of groupedByTokenId[key as any].records) {
      scoutgameMintsLogger.error('Missing tx', missingTx.transactionHash, 'tokenId', key);

      const matchingNft = nfts.find((nft) => nft.tokenId === Number(key));

      if (!matchingNft) {
        scoutgameMintsLogger.error(`NFT with tokenId ${key} not found`);
        // eslint-disable-next-line no-continue
        continue;
      }

      const price = await builderContractReadonlyApiClient.getTokenPurchasePrice({
        args: { tokenId: BigInt(key), amount: BigInt(missingTx.args.amount) },
        blockNumber: missingTx.blockNumber
      });

      const asPoints = convertCostToPoints(price);

      const address = transferSingleEvents[missingTx.transactionHash].args.to;

      if (!address) {
        scoutgameMintsLogger.error(`Tx ${missingTx.transactionHash} has no recipient address`);
      }

      await recordNftMint({
        amount: Number(missingTx.args.amount),
        scoutId: missingTx.args.scout,
        mintTxHash: missingTx.transactionHash,
        paidWithPoints: false,
        pointsValue: asPoints,
        builderNftId: matchingNft.id,
        recipientAddress: address
      });
    }
  }
}

export async function findAndIndexMissingStarterPackPurchases() {
  const builderScoutedEvents = await getBuilderStarterPackScoutedEvents({
    fromBlock: startBlockNumberForReindexing
  });
  const transferSingleEvents = await getStarterPackTransferSingleEvents({
    fromBlock: startBlockNumberForReindexing
  }).then((events) =>
    events.reduce(
      (acc, val) => {
        acc[val.transactionHash] = val;

        return acc;
      },
      {} as Record<string, TransferSingleEvent>
    )
  );

  const missingEvents: typeof builderScoutedEvents = [];

  const uniqueTxHashes = await prisma.nFTPurchaseEvent
    .groupBy({
      by: ['txHash']
    })
    .then((transactions) => new Set(transactions.map((tx) => tx.txHash)));

  for (const event of builderScoutedEvents) {
    if (!uniqueTxHashes.has(event.transactionHash)) {
      missingEvents.push(event);
    }
  }

  // Early exit
  if (!missingEvents.length) {
    scoutgameMintsLogger.info('No missing events found');
    return;
  }

  scoutgameMintsLogger.error(`Found ${missingEvents.length} missing events`);

  const groupedByTokenId = missingEvents.reduce(
    (acc, val) => {
      const tokenId = Number(val.args.tokenId);

      if (!acc[tokenId]) {
        acc[tokenId] = { records: [] };
      }

      acc[tokenId].records.push(val);

      return acc;
    },
    {} as Record<number, { records: BuilderScoutedEvent[] }>
  );

  const allTokenIdsAsString = Object.keys(groupedByTokenId).filter((_tokenId) => _tokenId !== '163');

  const nfts = await prisma.builderNft.findMany({
    where: {
      tokenId: {
        in: allTokenIdsAsString.map((key) => Number(key))
      },
      nftType: BuilderNftType.season_1_starter_pack
    }
  });

  for (const key of allTokenIdsAsString) {
    for (const missingTx of groupedByTokenId[key as any].records) {
      scoutgameMintsLogger.error('Missing tx', missingTx.transactionHash, 'tokenId', key);

      const matchingNft = nfts.find((nft) => nft.tokenId === Number(key));

      if (!matchingNft) {
        scoutgameMintsLogger.error(`NFT with tokenId ${key} not found`);
        // eslint-disable-next-line no-continue
        continue;
      }

      const price = await builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
        args: { amount: BigInt(missingTx.args.amount) },
        blockNumber: missingTx.blockNumber
      });

      const asPoints = convertCostToPoints(price);

      const address = transferSingleEvents[missingTx.transactionHash].args.to;

      if (!address) {
        scoutgameMintsLogger.error(`Tx ${missingTx.transactionHash} has no recipient address`);
      }

      await recordNftMint({
        amount: Number(missingTx.args.amount),
        scoutId: missingTx.args.scout,
        mintTxHash: missingTx.transactionHash,
        paidWithPoints: false,
        pointsValue: asPoints,
        builderNftId: matchingNft.id,
        recipientAddress: address
      });
    }
  }
}

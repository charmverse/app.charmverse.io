import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import type { BuilderScoutedEvent } from './accounting/getBuilderScoutedEvents';
import { getBuilderScoutedEvents } from './accounting/getBuilderScoutedEvents';
import type { TransferSingleEvent } from './accounting/getTransferSingleEvents';
import { getTransferSingleEvents } from './accounting/getTransferSingleEvents';

type SimplifiedGroupedEvent = {
  scoutId: string;
  amount: bigint;
  tokenId: bigint;
  txHash: string;
  blockNumber: bigint;
  transferEvent: TransferSingleEvent['args'];
  builderScoutedEvent: BuilderScoutedEvent['args'];
};

function groupEventsByTransactionHash(events: (BuilderScoutedEvent | TransferSingleEvent)[]): SimplifiedGroupedEvent[] {
  const eventMap: Record<string, Partial<SimplifiedGroupedEvent>> = {};

  for (const baseEvent of events) {
    const event = baseEvent;
    const { transactionHash, blockNumber } = event;

    if (!eventMap[transactionHash]) {
      eventMap[transactionHash] = { txHash: transactionHash, blockNumber: blockNumber as any };
    }
    if (event.eventName === 'TransferSingle') {
      eventMap[transactionHash].transferEvent = event.args;
      eventMap[transactionHash].tokenId = event.args.id;
    } else if (event.eventName === 'BuilderScouted') {
      eventMap[transactionHash].scoutId = event.args.scout;
      eventMap[transactionHash].amount = event.args.amount;
    }
  }

  return Object.values(eventMap).map((entry) => ({
    scoutId: entry.scoutId!,
    amount: entry.amount!,
    tokenId: entry.tokenId!,
    txHash: entry.txHash!,
    blockNumber: entry.blockNumber!,
    transferEvent: entry.transferEvent!,
    builderScoutedEvent: entry.builderScoutedEvent!
  }));
}

export async function getOnchainPurchaseEvents({
  scoutId,
  fromBlock,
  toBlock
}: {
  scoutId: string;
  fromBlock?: number;
  toBlock?: number;
}) {
  const [builderEventLogs, transferSingleEventLogs] = await Promise.all([
    getBuilderScoutedEvents({ fromBlock, toBlock }),
    getTransferSingleEvents({ fromBlock, toBlock })
  ]);

  const groupedEvents = groupEventsByTransactionHash([...builderEventLogs, ...transferSingleEventLogs]);

  const purchasesFromDate = fromBlock
    ? await getPublicClient(optimism.id)
        .getBlock({ blockNumber: BigInt(fromBlock), includeTransactions: false })
        .then((block) => new Date(Number(block.timestamp) * 1000))
    : undefined;

  const nftPurchases = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId,
      createdAt: purchasesFromDate
        ? {
            gte: purchasesFromDate
          }
        : undefined
    },
    select: {
      txHash: true,
      tokensPurchased: true,
      paidInPoints: true,
      pointsValue: true
    }
  });

  const pendingTransactions = await prisma.pendingNftTransaction.findMany({
    where: {
      userId: scoutId,
      createdAt: purchasesFromDate ? { gte: purchasesFromDate } : undefined
    },
    select: {
      id: true,
      sourceChainTxHash: true,
      sourceChainId: true,
      destinationChainTxHash: true,
      destinationChainId: true,
      tokenAmount: true,
      targetAmountReceived: true
    }
  });

  const mappedEvents = groupedEvents
    .filter((event) => event.scoutId === scoutId)
    .map((event) => {
      const nftPurchase = nftPurchases.find((nft) => nft.txHash === event.txHash) ?? null;
      const pendingTransaction =
        pendingTransactions.find(
          (tx) => tx.sourceChainTxHash === event.txHash || tx.destinationChainTxHash === event.txHash
        ) ?? null;
      return { ...event, nftPurchase, pendingTransaction };
    });

  return mappedEvents;
}

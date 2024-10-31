import { prisma } from '@charmverse/core/prisma-client';
import { createPublicClient, http, parseEventLogs } from 'viem';
import { optimism } from 'viem/chains';

import { getPublicClient } from '../../../blockchain/src/getPublicClient';

import { realOptimismMainnetBuildersContract } from './constants';

const transferSingle = {
  anonymous: false,
  inputs: [
    { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
    { indexed: true, internalType: 'address', name: 'from', type: 'address' },
    { indexed: true, internalType: 'address', name: 'to', type: 'address' },
    { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
    { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
  ],
  name: 'TransferSingle',
  type: 'event'
};

const builderScouted = {
  anonymous: false,
  inputs: [
    { indexed: false, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    { indexed: false, internalType: 'string', name: 'scout', type: 'string' }
  ],
  name: 'BuilderScouted',
  type: 'event'
};

export type TransferSingleEvent = {
  eventName: 'TransferSingle';
  args: { operator: string; from: string; to: string; id: string; value: string };
  transactionHash: string;
  blockNumber: string;
};

export type BuilderScoutedEvent = {
  eventName: 'BuilderScouted';
  args: { tokenId: string; amount: string; scout: string };
  transactionHash: string;
  blockNumber: string;
};

const contractAbi = [transferSingle, builderScouted];

// Set up your client for the desired chain
const client = createPublicClient({
  chain: optimism,
  transport: http(`https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
});

// Contract address and the event signature for filtering logs
const contractAddress = realOptimismMainnetBuildersContract;

// This is the block number where the OP Mainnet contract for the BuilderNFT was deployed
const startBlockNumber = 126_062_456;

export type ParsedLog = Awaited<ReturnType<typeof parseEventLogs>>[number] & {
  eventName: 'TransferSingle' | 'BuilderScouted';
  args: BuilderScoutedEvent['args'] | TransferSingleEvent['args'];
};

// Function to get logs for the contract and parse them against the ABI
export async function getAndParseNftMintLogs(
  {
    fromBlock = startBlockNumber,
    toBlock = 'latest'
  }: { fromBlock?: number | bigint; toBlock?: number | bigint | 'latest' } = {
    fromBlock: startBlockNumber
  }
): Promise<ParsedLog[]> {
  const logs = await client.getLogs({
    address: contractAddress,
    fromBlock: typeof fromBlock === 'bigint' ? fromBlock : BigInt(fromBlock),
    toBlock: typeof toBlock === 'number' ? BigInt(toBlock) : toBlock,
    events: [transferSingle, builderScouted]
  });

  const parsedLogs = parseEventLogs({ abi: contractAbi, logs, eventName: ['BuilderScouted', 'TransferSingle'] });

  return parsedLogs as ParsedLog[];
}

type SimplifiedGroupedEvent = {
  scoutId: string;
  amount: string;
  tokenId: string;
  txHash: string;
  blockNumber: string;
  transferEvent: {
    from: string;
    to: string;
    operator: string;
    value: string;
  };
  builderScoutedEvent: {
    scout: string;
    amount: string;
  };
};

function groupEventsByTransactionHash(events: ParsedLog[]): SimplifiedGroupedEvent[] {
  const eventMap: Record<string, Partial<SimplifiedGroupedEvent>> = {};

  for (const baseEvent of events) {
    const event = baseEvent;
    const { transactionHash, blockNumber } = event;

    if (!eventMap[transactionHash]) {
      eventMap[transactionHash] = { txHash: transactionHash, blockNumber: blockNumber as any };
    }

    if (event.eventName === 'TransferSingle') {
      const transferSingleEvent = event as any as TransferSingleEvent;
      eventMap[transactionHash].transferEvent = {
        from: transferSingleEvent.args.from,
        to: transferSingleEvent.args.to,
        operator: transferSingleEvent.args.operator,
        value: transferSingleEvent.args.value
      };
      eventMap[transactionHash].tokenId = transferSingleEvent.args.id;
    } else if (event.eventName === 'BuilderScouted') {
      const builderScoutedEvent = event as any as BuilderScoutedEvent;
      eventMap[transactionHash].builderScoutedEvent = {
        scout: builderScoutedEvent.args.scout,
        amount: builderScoutedEvent.args.amount
      };
      eventMap[transactionHash].scoutId = builderScoutedEvent.args.scout;
      eventMap[transactionHash].amount = builderScoutedEvent.args.amount;
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
  const logs = await getAndParseNftMintLogs({ fromBlock });

  const groupedEvents = groupEventsByTransactionHash(logs as any);

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

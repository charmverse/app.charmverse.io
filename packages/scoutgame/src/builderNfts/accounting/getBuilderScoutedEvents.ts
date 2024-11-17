import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { parseEventLogs } from 'viem';

import { builderNftChain } from '../constants';

import { contractAddress } from './constants';
import { convertBlockRange, type BlockRange } from './convertBlockRange';

const builderScouted = {
  anonymous: false,
  inputs: [
    { indexed: false, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    { indexed: false, internalType: 'string', name: 'scout', type: 'string' }
  ],
  name: 'BuilderScouted',
  type: 'event'
} as const;

export type BuilderScoutedEvent = {
  eventName: 'BuilderScouted';
  args: { tokenId: bigint; amount: bigint; scout: string };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

export function getBuilderScoutedEvents({ fromBlock, toBlock }: BlockRange): Promise<BuilderScoutedEvent[]> {
  return getPublicClient(builderNftChain.id)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: contractAddress,
      event: builderScouted
    })
    .then((logs) =>
      parseEventLogs({
        abi: [builderScouted],
        logs,
        eventName: 'BuilderScouted'
      })
    );
}

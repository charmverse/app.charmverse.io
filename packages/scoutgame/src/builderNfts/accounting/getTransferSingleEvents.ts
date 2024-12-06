import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { builderNftChain, getBuilderContractAddress, getBuilderStarterPackContractAddress } from '../constants';

import type { BlockRange } from './convertBlockRange';
import { convertBlockRange } from './convertBlockRange';

const transferSingleAbi = {
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
} as const;

export type TransferSingleEvent = {
  eventName: 'TransferSingle';
  args: { operator: Address; from: Address; to: Address; id: bigint; value: bigint };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

export function getTransferSingleEvents({ fromBlock, toBlock }: BlockRange): Promise<TransferSingleEvent[]> {
  return getPublicClient(builderNftChain.id)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: getBuilderContractAddress(),
      event: transferSingleAbi
    })
    .then((logs) =>
      parseEventLogs({
        abi: [transferSingleAbi],
        logs,
        eventName: 'TransferSingle'
      })
    );
}

export function getStarterPackTransferSingleEvents({ fromBlock, toBlock }: BlockRange): Promise<TransferSingleEvent[]> {
  return getPublicClient(builderNftChain.id)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: getBuilderStarterPackContractAddress(),
      event: transferSingleAbi
    })
    .then((logs) =>
      parseEventLogs({
        abi: [transferSingleAbi],
        logs,
        eventName: 'TransferSingle'
      })
    );
}

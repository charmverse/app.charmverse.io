import { log } from '@charmverse/core/log';

import * as http from 'adapters/http';
import { getTokenDecimals } from 'lib/blockchain/getTokenDecimals';

const SNAPSHOT_SCORE_URL = 'https://score.snapshot.org';

function createPayload({
  blockNumber,
  tokenContractAddress,
  chainId,
  walletAddress,
  decimals
}: {
  walletAddress: string;
  chainId: number;
  tokenContractAddress: string;
  blockNumber: string;
  decimals: number;
}) {
  return {
    jsonrpc: '2.0',
    method: 'get_vp',
    params: {
      address: walletAddress,
      network: chainId,
      strategies: [
        {
          name: 'erc20-balance-of',
          network: chainId,
          params: {
            address: tokenContractAddress,
            decimals
          }
        }
      ],
      snapshot: blockNumber
    }
  };
}

type SnapshotSuccessResponse = {
  jsonrpc: '2.0';
  result: {
    vp: number;
    vp_by_strategy: number[];
    vp_state: string;
  };
  id: null;
  cache: boolean;
};

type SnapshotErrorResponse = {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data: string;
  };
  id: null;
};

type SnapshotScoreResponse = SnapshotSuccessResponse | SnapshotErrorResponse;

export async function getTokenAmountOnBlockNumber({
  blockNumber,
  tokenContractAddress,
  chainId,
  walletAddress
}: {
  tokenContractAddress: string;
  blockNumber: string;
  chainId: number;
  walletAddress: string;
}) {
  try {
    const tokenDecimals = await getTokenDecimals({ chainId, tokenContractAddress });
    if (tokenDecimals === null) {
      return 0;
    }

    const snapshotScoreResponse = await http.POST<SnapshotScoreResponse>(
      SNAPSHOT_SCORE_URL,
      createPayload({
        blockNumber,
        tokenContractAddress,
        chainId,
        walletAddress,
        decimals: tokenDecimals
      })
    );

    if ('error' in snapshotScoreResponse) {
      return 0;
    }

    return snapshotScoreResponse.result.vp;
  } catch (error) {
    log.error('Error getting token amount on block number', {
      error,
      blockNumber,
      tokenContractAddress,
      chainId,
      walletAddress
    });
    return 0;
  }
}

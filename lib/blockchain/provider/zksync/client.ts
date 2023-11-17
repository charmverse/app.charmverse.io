import { RateLimit } from 'async-sema';
import type { AccountState, NFTInfo } from 'zksync/build/types';

import { GET } from 'adapters/http';

import { supportedNetworks, type SupportedChainId } from './config';
// --------------------------------------------------
// https://docs.zksync.io/apiv02-docs/
export const ZK_ERA_API_ENDPOINT = 'https://api.zksync.io/api/v0.2';
const ZK_ERA_TEST_API_ENDPOINT = 'https://goerli-api.zksync.io/api/v0.2';

// 30 requests/minute with no api key
export const rateLimiter = RateLimit(0.5);

class ZkSyncApiClient {
  baseUrl: string;

  constructor({ chainId }: { chainId: SupportedChainId }) {
    if (!supportedNetworks.includes(chainId)) {
      throw new Error(`Unsupported chain id: ${chainId}`);
    }
    this.baseUrl = chainId === 324 ? ZK_ERA_API_ENDPOINT : ZK_ERA_TEST_API_ENDPOINT;
  }

  getAccountState(accountIdOrAddress: string | number): Promise<AccountState> {
    return GET(`${this.baseUrl}/accounts/${accountIdOrAddress}`).then((data: any) => data.result);
  }

  getNFTInfo(nftId: number): Promise<NFTInfo> {
    return GET(`${this.baseUrl}/tokens/nft/${nftId}`).then((data: any) => data.result);
  }

  getNFTOwner(nftId: number): Promise<number> {
    return GET(`${this.baseUrl}/tokens/nft/${nftId}/owner`).then((data: any) => data.result);
  }
}
export const zkMainnetClient = new ZkSyncApiClient({ chainId: 324 });
export const zkTestnetClient = new ZkSyncApiClient({ chainId: 280 });

export function getClient({ chainId }: { chainId: SupportedChainId }) {
  if (!supportedNetworks.includes(chainId)) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }
  return chainId === 324 ? zkMainnetClient : zkTestnetClient;
}

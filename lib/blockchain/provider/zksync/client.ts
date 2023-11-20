import { RateLimit } from 'async-sema';
import type { AccountState, NFTInfo } from 'zksync/build/types';

import { GET } from 'adapters/http';
import { writeToSameFolder } from 'lib/utilities/file';

import { supportedNetworks, type SupportedChainId } from './config';

// https://docs.reservoir.tools/reference/gettokensv6
const RESERVOIR_NFT_API_KEY = process.env.RESERVOIR_NFT_API_KEY as string;
const RESERVOIR_BASE_URL = 'https://api.reservoir.tools';

// https://docs.zksync.io/apiv02-docs/
export const ZK_ERA_API_ENDPOINT = 'https://api.zksync.io/api/v0.2';
const ZK_ERA_TEST_API_ENDPOINT = 'https://goerli-api.zksync.io/api/v0.2';

// 30 requests/minute with no api key
export const rateLimiter = RateLimit(0.5);

export type TokenActivityFromReservoirApi = {
  type: 'ask';
  fromAddress: string;
  toAddress: string | null;
  price: {
    currency: {
      contract: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    amount: {
      raw: string;
      decimal: number;
      usd: number;
      native: number;
    };
  };
  amount: number;
  timestamp: number;
  createdAt: string;
  contract: string;
  token: {
    tokenId: string;
    isSpam?: boolean;
    tokenName?: string;
    tokenImage?: string;
  };
  collection: {
    collectionId: string;
    isSpam?: boolean;
    collectionName?: string;
    collectionImage?: string;
  };
  order: {
    id: string;
    side: 'ask';
    source: {
      domain: string;
      name: string;
      icon?: string;
    };
    criteria: {
      kind: 'token';
      data: {
        collection: {
          id: string;
          name?: string;
          image?: string;
          isSpam?: boolean;
        };
        token: {
          tokenId: string;
          name?: string | null;
          image?: string | null;
          isSpam?: boolean;
        };
      };
    };
  };
};

type Activities = {
  activities: TokenActivityFromReservoirApi[];
  continuation?: string;
};

class ZkSyncApiClient {
  baseUrl: string;

  reservoirBaseUrl: string = RESERVOIR_BASE_URL;

  reservoirApiKey: string = RESERVOIR_NFT_API_KEY;

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

  getNFTCollectionMetaData(nftContract: string, identifier: string | number): Promise<any> {
    return GET(
      `${this.reservoirBaseUrl}/tokens/v6`,
      { tokenSetId: `${nftContract}:${identifier}` },
      {
        headers: {
          'x-api-key': this.reservoirApiKey
        }
      }
    );
  }

  getNFTMetaData(nftContract: string, identifier: string | number): Promise<TokenActivityFromReservoirApi> {
    return GET<Activities>(
      `${this.reservoirBaseUrl}/tokens/${nftContract}:${identifier}/activity/v5`,
      undefined,
      // { token: `${nftContract}:${identifier}` },
      {
        headers: {
          'x-api-key': this.reservoirApiKey
        }
      }
    ).then((data) => data.activities[0]);
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

zkMainnetClient.getNFTInfo(2048134).then(console.log);
// zkMainnetClient
//   .getNFTMetaData('0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63', 1691)
//   .then(async (val) => {
//     await writeToSameFolder({ data: JSON.stringify(val, null, 2), fileName: 'reservoir-api' });
//     console.log(JSON.stringify(val, null, 2));
//   })
//   .catch(console.error);

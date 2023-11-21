import ERC721_ABI from 'abis/ERC721.json';
import { RateLimit } from 'async-sema';
import { ethers } from 'ethers';
import { Provider } from 'zksync';
import type { AccountState, NFTInfo } from 'zksync/build/types';

import { GET } from 'adapters/http';
import { writeToSameFolder } from 'lib/utilities/file';

import { supportedNetworks, type SupportedChainId } from './config';

// https://docs.reservoir.tools/reference/gettokensv6
const RESERVOIR_NFT_API_KEY = process.env.RESERVOIR_NFT_API_KEY as string;
const RESERVOIR_BASE_URL = 'https://api.reservoir.tools';

// https://docs.zksync.io/apiv02-docs/
export const ZK_RPC_ENDPOINT = 'https://api.zksync.io/jsrpc';
const ZK_RPC_TEST_ENDPOINT = 'https://goerli-api.zksync.io/jsrpc';

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

  rpcUrl: string;

  provider?: Provider;

  reservoirBaseUrl: string = RESERVOIR_BASE_URL;

  reservoirApiKey: string = RESERVOIR_NFT_API_KEY;

  constructor({ chainId }: { chainId: SupportedChainId }) {
    if (!supportedNetworks.includes(chainId)) {
      throw new Error(`Unsupported chain id: ${chainId}`);
    }
    this.baseUrl = chainId === 324 ? ZK_ERA_API_ENDPOINT : ZK_ERA_TEST_API_ENDPOINT;
    this.rpcUrl = chainId === 324 ? ZK_RPC_ENDPOINT : ZK_RPC_TEST_ENDPOINT;
  }

  async init() {
    this.provider = await Provider.newHttpProvider(this.rpcUrl, undefined);
    return this;
  }

  getAccountState(accountIdOrAddress: string | number): Promise<AccountState> {
    return this.provider?.getState(accountIdOrAddress);
    //    return GET(`${this.baseUrl}/accounts/${accountIdOrAddress}`).then((data: any) => data.result);
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
      { collection: nftContract },
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
      { token: `${nftContract}:${identifier}` },
      {
        headers: {
          'x-api-key': this.reservoirApiKey
        }
      }
    ).then(async (data) => {
      const activity = data.activities[0];

      const contractAddress = activity.contract;

      const provider = new ethers.providers.JsonRpcProvider(ZK_RPC_ENDPOINT, 324);
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      const result = await contract.tokenURI(identifier);

      console.log('RESULT', result);
    });
  }
}
export const zkMainnetClient = new ZkSyncApiClient({ chainId: 324 });
export const zkTestnetClient = new ZkSyncApiClient({ chainId: 280 });

export async function getClient({ chainId }: { chainId: SupportedChainId }) {
  if (!supportedNetworks.includes(chainId)) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }

  return chainId === 324 ? zkMainnetClient.init() : zkTestnetClient.init();
}

// zkMainnetClient
//   .init()
//   .then((client) => client.getAccountState('0xa9c524d6bc22781cb0413d8965e980b1b3f8e0c7'))
//   .then(console.log);

// zkMainnetClient.getNFTCollectionMetaData('0xba547b64281a198f222cadccb6e19d5432615323', 5).then(console.log);

// zkMainnetClient.getNFTInfo(2561682).then(console.log);
zkMainnetClient
  .init()
  .then((client) => client.getNFTMetaData('0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63', 123))
  .then(console.log);
//   .then(async (val) => {
//     await writeToSameFolder({ data: JSON.stringify(val, null, 2), fileName: 'reservoir-api' });
//     console.log(JSON.stringify(val, null, 2));
//   })
//   .catch(console.error);

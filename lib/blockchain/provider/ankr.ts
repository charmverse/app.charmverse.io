import type { Nft } from '@ankr.com/ankr.js';
import { AnkrProvider } from '@ankr.com/ankr.js';
import { RateLimit } from 'async-sema';

import { getNFTUrl } from 'components/common/CharmEditor/components/nft/utils';
import { paginatedCall } from 'lib/utilities/async';
import { typedKeys } from 'lib/utilities/objects';

import type { NFTData } from '../getNFTs';

// 50 requests/minute for Public tier - https://www.ankr.com/docs/rpc-service/service-plans/#rate-limits
const rateLimiter = RateLimit(0.8);

// Find supported chains:  https://www.npmjs.com/package/@ankr.com/ankr.js
const ankrApis = {
  1: 'eth',
  5: 'eth_goerli',
  10: 'optimism',
  56: 'bsc',
  137: 'polygon',
  250: 'fantom',
  42161: 'arbitrum',
  43114: 'avalanche'
} as const;

// https://docs.alchemy.com/docs/why-use-alchemy#-blockchains-supported
export const supportedChainIds = typedKeys(ankrApis);
export type SupportedChainId = (typeof supportedChainIds)[number];

export const supportedMainnets: SupportedChainId[] = [1, 10, 56, 137, 250, 42161, 43114];

const advancedAPIEndpoint = `https://rpc.ankr.com/multichain/${process.env.ANKR_API_ID}`;

// Docs: https://docs.alchemy.com/reference/getnfts
export const getNFTs = async ({
  chainId,
  address,
  walletId
}: {
  chainId: SupportedChainId;
  address: string;
  walletId: string;
}): Promise<NFTData[]> => {
  const provider = new AnkrProvider(advancedAPIEndpoint);
  const blockchain = ankrApis[chainId];
  const results = await paginatedCall(
    async (params) => {
      await rateLimiter();
      return provider.getNFTsByOwner({
        ...params,
        blockchain,
        walletAddress: address
      });
    },
    (response) => (response.nextPageToken ? { pageToken: response.nextPageToken } : null)
  );
  const nfts = results
    .map((result) => result.assets)
    .flat()
    .map((nft) => mapNFTData(nft, walletId, chainId));
  return nfts;
};

function mapNFTData(nft: Nft, walletId: string | null, chainId: SupportedChainId): NFTData {
  const tokenIdInt = parseInt(nft.tokenId, 16);
  const link = getNFTUrl({ chain: chainId, contract: nft.contractAddress, token: tokenIdInt }) ?? '';
  return {
    id: `${nft.contractAddress}:${nft.tokenId}`,
    tokenId: nft.tokenId,
    tokenIdInt,
    contract: nft.contractAddress,
    imageRaw: nft.imageUrl,
    image: nft.imageUrl,
    imageThumb: nft.imageUrl,
    title: nft.name,
    description: '',
    chainId,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link,
    walletId
  };
}

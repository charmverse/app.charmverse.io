import { log } from '@charmverse/core/log';
import { ZDK, ZDKNetwork, ZDKChain } from '@zoralabs/zdk';
import { RateLimit } from 'async-sema';
import { zora } from 'viem/chains/definitions/zora';

import { isTestEnv } from 'config/constants';

import type { NFTData } from '../../getNFTs';

// Ref: https://docs.zora.co/docs/zora-api/zdk
// NFT example: https://docs.zora.co/docs/guides/zdk-intro-guide

const networks = [
  { network: ZDKNetwork.Zora, chain: ZDKChain.ZoraMainnet },
  { network: ZDKNetwork.Zora, chain: ZDKChain.ZoraGoerli }
];

const API_ENDPOINT = 'https://api.zora.co/graphql';

// 30 requests/minute with no api
export const rateLimiter = RateLimit(0.5);

export function getClient() {
  if (isTestEnv) {
    // zora api doesn't require an api key, so don't use it in test mode
    return null;
  }
  return new ZDK({
    endpoint: API_ENDPOINT,
    networks,
    apiKey: process.env.ZORA_API_KEY
  });
}

// Docs: https://api-docs.ankr.com/reference/post_ankr-getnftholders
export async function getNFTs({
  chainId = ZDKChain.Mainnet,
  address,
  walletId
}: {
  chainId: ZDKChain.Mainnet;
  address: string;
  walletId: string;
}): Promise<NFTData[]> {
  const provider = getClient();
  if (!provider) {
    log.warn('Zora api is not configured to retrieve NFTs');
    return [];
  }
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
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
}

function mapNFTData(nft: NFTFields, walletId: string | null, chainId: SupportedChainId): NFTData {
  const link = getNFTUrl({ chain: chainId, contract: nft.contractAddress, token: nft.tokenId }) ?? '';
  return {
    id: `${nft.contractAddress}:${nft.tokenId}`,
    tokenId: nft.tokenId,
    tokenIdInt: toInt(nft.tokenId),
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

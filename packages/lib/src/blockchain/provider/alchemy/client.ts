import env from '@beam-australia/react-env';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { isTruthy } from '@packages/utils/types';
import { GET } from '@packages/adapters/http';
import { paginatedCall } from '@packages/lib/utils/async';

import type { NFTData } from '../../getNFTs';
import { getNFTUrl } from '../../getNFTUrl';

import type { SupportedChainId } from './config';

interface NftMedia {
  cachedUrl?: string;
  thumbnailUrl: string;
  pngUrl?: string;
  contentType: string;
  size: number;
  originalUrl: string;
}

type AlchemyApiSuffix = '' | 'nft';

type UnstoppableDomainsMetaData = {
  external_link: string;
  image_url?: string;
  attributes?: [];
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
  name: string;
  tokenId: string;
  namehash: string;
  description: string;
  image: string;
  external_url: string;
};

interface AlchemyNft {
  contract: {
    address: string;
    name: string;
    symbol: string;
    contractDeployer: string;
    tokenType: 'ERC1155' | 'ERC721';
  };
  tokenId: string;
  tokenType: string;
  name: string;
  description: string;
  image: NftMedia;
  tokenUri: string;
  error?: string;
  timeLastUpdated: string;
  walletAddress: string;
}

interface AlchemyNftResponse {
  blockHash: string;
  ownedNfts: AlchemyNft[];
  totalCount: number;
  pageKey?: string; // 100 nfts per page
}
export const getAlchemyBaseUrl = (
  chainId: SupportedChainId = 1,
  apiSuffix: AlchemyApiSuffix = '',
  version: 'v2' | 'v3' = 'v2'
): string => {
  const apiKey = process.env.ALCHEMY_API_KEY || env('ALCHEMY_API_KEY');

  if (!apiKey) {
    throw new Error('No api key provided for Alchemy');
  }

  const alchemyUrl = getChainById(chainId)?.alchemyUrl;
  if (!alchemyUrl) throw new Error(`Chain id "${chainId}" not supported by Alchemy`);

  const apiSuffixPath = apiSuffix ? `${apiSuffix}/` : '';

  return `${alchemyUrl}/${apiSuffixPath}${version}/${apiKey}`;
};

// Docs: https://docs.alchemy.com/reference/getnfts
export async function getNFTs({
  address,
  chainId = 1,
  walletId
}: {
  address: string;
  chainId: SupportedChainId;
  walletId: string;
}): Promise<NFTData[]> {
  const url = `${getAlchemyBaseUrl(chainId, 'nft', 'v3')}/getNFTsForOwner`;
  const responses = await paginatedCall(
    async (params) => {
      const resp = await GET<AlchemyNftResponse>(url, {
        ...params,
        owner: address
      });
      const updatedResp = await Promise.all(resp.ownedNfts.map(updateNFTResp));
      return {
        ...resp,
        ownedNfts: updatedResp
      };
    },
    (response) => (response.pageKey ? { pageKey: response.pageKey } : null)
  );

  const mappedNfts = responses
    // extract nft array from responses
    .map((response) => response.ownedNfts)
    .flat()
    // Filter out invalid NFTs
    .filter((n) => {
      // The error is most likely to be "Contract returned a broken token uri"
      if (n.error) {
        return false;
      }
      // No artwork found (animations and videos dotimeLastUpdatednt seem to be picked up)
      if (!n.image.thumbnailUrl && !n.image.originalUrl) {
        return false;
      }
      return true;
    })
    .map((nft) => mapNFTData(nft, walletId, chainId))
    .filter(isTruthy);

  return mappedNfts;
}

export async function getNFT({
  address,
  tokenId,
  chainId = 1
}: {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
}) {
  const url = `${getAlchemyBaseUrl(chainId, 'nft', 'v3')}/getNFTMetadata`;
  let res = await GET<AlchemyNft>(url, { contractAddress: address, tokenId });
  if (res.name === 'Failed to load NFT metadata') {
    res = await GET<AlchemyNft>(url, { contractAddress: address, tokenId, refreshCache: true });
  }
  const updateRes = await updateNFTResp(res);
  return mapNFTData(updateRes, null, chainId);
}

export async function getNFTOwners({
  address,
  tokenId,
  chainId = 1
}: {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
}) {
  const url = `${getAlchemyBaseUrl(chainId, 'nft', 'v3')}/getOwnersForNFT`;
  const res = await GET<{ owners: string[] }>(url, { contractAddress: address, tokenId });

  return res.owners;
}

function mapNFTData(nft: AlchemyNft, walletId: string | null, chainId: SupportedChainId): NFTData | null {
  if (nft.error) {
    // errors include "Contract does not have any code"
    return null;
  }
  const tokenIdBigInt = BigInt(nft.tokenId).toString();
  const link = getNFTUrl({ chain: chainId, contract: nft.contract.address, token: tokenIdBigInt }) ?? '';

  // not sure if 'raw' or 'gateway' is best, but for this NFT, the 'raw' url no longer exists: https://opensea.io/assets/ethereum/0x1821d56d2f3bc5a5aba6420676a4bbcbccb2f7fd/3382
  const image = nft.image.thumbnailUrl?.startsWith('https://') ? nft.image.thumbnailUrl : nft.image.originalUrl || '';
  return {
    id: `${nft.contract.address}:${nft.tokenId}`,
    tokenId: tokenIdBigInt,
    contract: nft.contract.address,
    imageRaw: nft.image.originalUrl,
    image,
    imageThumb: nft.image.thumbnailUrl,
    title: nft.name || '',
    description: nft.description || '',
    chainId,
    timeLastUpdated: nft.timeLastUpdated,
    isHidden: false,
    isPinned: false,
    link,
    walletId,
    contractName: nft.contract.name
  };
}

async function updateNFTResp(nft: AlchemyNft): Promise<AlchemyNft> {
  if (nft.contract.symbol === 'UD') {
    const udMetadata = await GET<UnstoppableDomainsMetaData>(nft.tokenUri).catch(() => null);

    return {
      ...nft,
      name: udMetadata?.name || nft.name,
      image: {
        ...nft.image,
        thumbnailUrl: udMetadata?.image || nft.image.thumbnailUrl,
        originalUrl: udMetadata?.image || nft.image.originalUrl
      }
    };
  }
  return nft;
}

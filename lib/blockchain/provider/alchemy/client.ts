import { getChainById } from 'connectors/chains';

import { GET } from 'adapters/http';
import { getNFTUrl } from 'components/common/CharmEditor/components/nft/utils';
import { paginatedCall } from 'lib/utils/async';
import { isTruthy } from 'lib/utils/types';

import type { NFTData } from '../../getNFTs';
import { toInt } from '../ankr/client';

import type { SupportedChainId } from './config';

interface NftMedia {
  bytes: number;
  format: string;
  gateway: string;
  raw: string;
  thumbnail: string;
}

type AlchemyApiSuffix = '' | 'nft';

export interface AlchemyNft {
  contract: {
    address: string;
  };
  id: {
    tokenId: string;
  };
  error?: string;
  title: string;
  contractMetadata: {
    name: string;
    symbol: string;
    contractDeployer: string;
    tokenType: 'ERC1155' | 'ERC721';
  };
  description: string;
  tokenUri: {
    raw: string;
    gateway: string;
  };
  media: NftMedia[];
  timeLastUpdated: string;
  walletAddress: string;
}

interface AlchemyNftResponse {
  blockHash: string;
  ownedNfts: AlchemyNft[];
  totalCount: number;
  pageKey?: string; // 100 nfts per page
}

const FILTERED_NFT_CONTRACTS = [
  '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85' // ENS
];

export const getAlchemyBaseUrl = (chainId: SupportedChainId = 1, apiSuffix: AlchemyApiSuffix = ''): string => {
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    throw new Error('No api key provided for Alchemy');
  }

  const alchemyUrl = getChainById(chainId)?.alchemyUrl;
  if (!alchemyUrl) throw new Error(`Chain id "${chainId}" not supported by Alchemy`);

  const apiSuffixPath = apiSuffix ? `${apiSuffix}/` : '';

  return `${alchemyUrl}/${apiSuffixPath}v2/${apiKey}`;
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
  const url = `${getAlchemyBaseUrl(chainId, 'nft')}/getNFTs`;

  const responses = await paginatedCall(
    (params) => {
      return GET<AlchemyNftResponse>(url, {
        ...params,
        owner: address
      });
    },
    (response) => (response.pageKey ? { pageKey: response.pageKey } : null)
  );

  const mappedNfts = responses
    // extract nft array from responses
    .map((response) => response.ownedNfts)
    .flat()
    // Filter out invalid NFTs
    .filter((n) => {
      if (FILTERED_NFT_CONTRACTS.includes(n.contract.address)) {
        return false;
      }
      // The error is most likely to be "Contract returned a broken token uri"
      if (n.error) {
        return false;
      }
      // No artwork found (animations and videos dotimeLastUpdatednt seem to be picked up)
      if (!n.media[0].gateway) {
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
  const url = `${getAlchemyBaseUrl(chainId)}/getNFTMetadata`;
  const res = await GET<AlchemyNft>(url, { contractAddress: address, tokenId });
  return mapNFTData(res, null, chainId);
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
  const url = `${getAlchemyBaseUrl(chainId)}/getOwnersForToken`;
  const res = await GET<{ owners: string[] }>(url, { contractAddress: address, tokenId });

  return res.owners;
}

// export async function getTokenBalances({
//   ownerAddress,
//   chainAddress,
//   chainId
// }: {
//   ownerAddress: string;
//   chainAddress: string;
//   chainId: SupportedChainId;
// }) {
//   const url = `${getAlchemyBaseUrl(chainId)}`;
//   const payload = {
//     jsonrpc: '2.0',
//     method: 'alchemy_getTokenBalances',
//     params: [ownerAddress, [chainAddress]],
//     id: chainId
//   };

//   const res = await PUT<AlchemyNft>(url, payload);
//   return res;
// }

function mapNFTData(nft: AlchemyNft, walletId: string | null, chainId: SupportedChainId): NFTData | null {
  if (nft.error) {
    // errors include "Contract does not have any code"
    return null;
  }
  const tokenIdInt = toInt(nft.id.tokenId);
  const link = getNFTUrl({ chain: chainId, contract: nft.contract.address, token: tokenIdInt }) ?? '';

  // not sure if 'raw' or 'gateway' is best, but for this NFT, the 'raw' url no longer exists: https://opensea.io/assets/ethereum/0x1821d56d2f3bc5a5aba6420676a4bbcbccb2f7fd/3382
  const image = nft.media[0].gateway?.startsWith('https://') ? nft.media[0].gateway : nft.media[0].raw;
  return {
    id: `${nft.contract.address}:${nft.id.tokenId}`,
    tokenId: nft.id.tokenId,
    tokenIdInt,
    contract: nft.contract.address,
    imageRaw: nft.media[0].raw,
    image,
    imageThumb: nft.media[0].thumbnail,
    title: nft.title,
    description: nft.description,
    chainId,
    timeLastUpdated: nft.timeLastUpdated,
    isHidden: false,
    isPinned: false,
    link,
    walletId,
    contractName: nft.contractMetadata.name
  };
}

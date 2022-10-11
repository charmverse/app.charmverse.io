import orderBy from 'lodash/orderBy';

import { GET } from 'adapters/http';

export const SupportedChainIds = [1, 4, 5, 137, 80001, 42161] as const;
export type SupportedChainId = typeof SupportedChainIds[number]

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
  title: string;
  description: string;
  tokenUri: {
    raw: string;
    gateway: string;
  };
  media: NftMedia[];
  timeLastUpdated: string;
}

interface AlchemyNftResponse {
  blockHash: string;
  ownedNfts: AlchemyNft[];
  totalCount: number;
}

const alchemyApis: Record<SupportedChainId, string> = {
  1: 'eth-mainnet',
  4: 'eth-rinkeby',
  5: 'eth-goerli',
  137: 'polygon-mainnet',
  80001: 'polygon-mumbai',
  42161: 'arb-mainnet'
};

const FILTERED_NFT_CONTRACTS = [
  '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85' // ENS
];

export const getAlchemyBaseUrl = (chainId: SupportedChainId = 1, apiSuffix: AlchemyApiSuffix = ''): string => {
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    throw new Error('No api key provided for Alchemy');
  }

  const apiSubdomain = alchemyApis[chainId];
  const apiSuffixPath = apiSuffix ? `${apiSuffix}/` : '';

  if (!apiSubdomain) {
    throw new Error('Chain not supported');
  }

  return `https://${apiSubdomain}.g.alchemy.com/${apiSuffixPath}v2/${apiKey}`;
};

// Docs: https://docs.alchemy.com/reference/getnfts
export const getAddressNfts = async (address: string, chainId: SupportedChainId = 1) => {
  const url = `${getAlchemyBaseUrl(chainId, 'nft')}/getNFTs`;
  const res = await GET<AlchemyNftResponse>(url, { owner: address, filters: ['AIRDROPS', 'SPAM'] });
  return res.ownedNfts;
};

export const getNFTs = async (addresses: string[], chainId: SupportedChainId = 1) => {
  const promises = addresses.map(address => getAddressNfts(address, chainId));

  const results = await Promise.allSettled(promises);
  const nfts = results.reduce((acc: AlchemyNft[], res) => {
    if (res.status === 'fulfilled') {
      return [...acc, ...res.value];
    }
    else {
      return acc;

    }
  }, [])
    // Filter out invalid NFTs
    .filter(n => !!n.media?.length
      && !!n.media[0].gateway
      && !FILTERED_NFT_CONTRACTS.includes(n.contract.address));

  const sortedNfts = orderBy(nfts, (nft) => new Date(nft.timeLastUpdated), 'desc');

  return sortedNfts;
};

export const getNFT = async (contractAddress: string, tokenId: string, chainId: SupportedChainId = 1) => {
  const url = `${getAlchemyBaseUrl(chainId)}/getNFTMetadata`;
  const res = await GET<AlchemyNft>(url, { contractAddress, tokenId });

  return res;
};

export const getOwners = async (contractAddress: string, tokenId: string, chainId: SupportedChainId = 1) => {
  const url = `${getAlchemyBaseUrl(chainId)}/getOwnersForToken?contractAddress=${contractAddress}&tokenId=${tokenId}`;
  const res = await GET<{ owners: string[] }>(url);

  return res.owners;
};


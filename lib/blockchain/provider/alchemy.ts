import { GET } from 'adapters/http';
import { AlchemyNft, AlchemyNftResponse } from 'lib/blockchain/provider/types';
import orderBy from 'lodash/orderBy';

export type SupportedChainId = 1 | 4 | 5 | 137 | 80001 | 42161

export type AlchemyApiSuffix = '' | 'nft'

const alchemyApis: Record<SupportedChainId, string> = {
  1: 'eth-mainnet',
  4: 'eth-rinkeby',
  5: 'eth-goerli',
  137: 'polygon-mainnet',
  80001: 'polygon-mumbai',
  42161: 'arb-mainnet'
};

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

export const getAddressNfts = async (address: string, chainId: SupportedChainId = 1) => {
  const url = `${getAlchemyBaseUrl(chainId)}/getNFTs?owner=${address}`;
  const res = await GET<AlchemyNftResponse>(url);

  return res.ownedNfts;
};

export const getNfts = async (addresses: string[], chainId: SupportedChainId = 1) => {
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
    .filter(n => !!n.media?.length);

  const sortedNfts = orderBy(nfts, (nft) => new Date(nft.timeLastUpdated), 'desc');

  return sortedNfts;
};

export const getNft = async (contractAddress: string, tokenId: string, chainId: SupportedChainId = 1) => {
  const url = `${getAlchemyBaseUrl(chainId)}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
  const res = await GET<AlchemyNft>(url);

  return res;
};

export const getOwners = async (contractAddress: string, tokenId: string, chainId: SupportedChainId = 1) => {
  const url = `${getAlchemyBaseUrl(chainId)}/getOwnersForToken?contractAddress=${contractAddress}&tokenId=${tokenId}`;
  const res = await GET<{ owners: string[] }>(url);

  return res.owners;
};

export const alchemyApi = { getNfts, getNft, getOwners };

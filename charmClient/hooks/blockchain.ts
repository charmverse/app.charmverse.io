import type { NFTData, NFTRequest } from 'lib/blockchain/getNFTs';

import { useGETImmutable } from './helpers';

export function useGetNFT(attrs: Partial<NFTRequest>) {
  const makeRequest = !!(attrs.chainId && attrs.address && attrs.tokenId);
  return useGETImmutable<NFTData | null>(makeRequest ? `/api/nft/get` : null, attrs);
}

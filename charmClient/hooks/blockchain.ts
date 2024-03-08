import type { NFTData, NFTRequest } from 'lib/blockchain/getNFTs';
import type { LoggedInUser } from 'models';

import { useGETImmutable, usePOST } from './helpers';

export function useGetNFT(attrs: Partial<NFTRequest>) {
  const makeRequest = !!(attrs.chainId && attrs.address && attrs.tokenId);
  return useGETImmutable<NFTData | null>(makeRequest ? `/api/nft/get` : null, attrs);
}

export function useRefreshENSName() {
  return usePOST<{ address: string }, LoggedInUser>(`/api/nft/refresh-ensname`);
}

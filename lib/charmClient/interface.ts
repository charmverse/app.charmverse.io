import { NftData } from 'lib/nft/types';

export interface GetNftsResponse {
  visibleNfts: NftData[]
  hiddenNfts: NftData[]
}

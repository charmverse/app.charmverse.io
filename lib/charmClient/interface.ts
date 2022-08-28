import { NftData } from 'lib/nft/types';

export interface NftDataResponse {
  visibleNfts: NftData[]
  hiddenNfts: NftData[]
}

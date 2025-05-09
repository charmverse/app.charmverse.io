import * as http from '@packages/adapters/http';

import type { NFTData, NFTRequest } from '@packages/lib/blockchain/getNFTs';

export class BlockchainApi {
  getNFT(params: NFTRequest) {
    return http.GET<NFTData | null>(`/api/nft/get`, params);
  }

  listNFTs(userId: string) {
    return http.GET<NFTData[]>(`/api/nft/list/${userId}`);
  }
}

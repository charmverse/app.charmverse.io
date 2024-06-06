import * as http from 'adapters/http';
import type { NFTData, NFTRequest } from 'lib/blockchain/getNFTs';

export class BlockchainApi {
  getNFT(params: NFTRequest) {
    return http.GET<NFTData | null>(`/api/nft/get`, params);
  }

  listNFTs(userId: string) {
    return http.GET<NFTData[]>(`/api/nft/list/${userId}`);
  }
}

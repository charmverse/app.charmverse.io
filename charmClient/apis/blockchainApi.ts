import * as http from 'adapters/http';
import type { NftData } from 'lib/blockchain/interfaces';

export class BlockchainApi {

  listNFTs (userId: string) {
    return http.GET<NftData[]>(`/api/nft/list/${userId}`);
  }
}


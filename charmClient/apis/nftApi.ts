import * as http from 'adapters/http';
import type { NftData } from 'lib/blockchain/interfaces';

export class NftApi {

  list (userId: string) {
    return http.GET<NftData[]>(`/api/nft/list/${userId}`);
  }
}


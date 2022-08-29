import * as http from 'adapters/http';
import { NftData } from 'lib/nft/interfaces';

export class NftApi {
  async list (userId: string) {
    const data = await http.GET<NftData[]>(`/api/nft/list/${userId}`);

    return data;
  }
}


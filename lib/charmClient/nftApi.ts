import * as http from 'adapters/http';
import { NftDataResponse } from './interface';

export class NftApi {
  async list (userId: string) {
    const data = await http.GET<NftDataResponse>(`/api/nft/list/${userId}`);

    return data;
  }
}


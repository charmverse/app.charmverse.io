import * as http from 'adapters/http';
import { GetNftsResponse } from './interface';

export class NftApi {
  async list (userId: string) {
    const data = await http.GET<GetNftsResponse>(`/api/nft/list/${userId}`);

    return data;
  }
}


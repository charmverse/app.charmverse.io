import * as http from 'adapters/http';
import { GetNftsResponse } from 'lib/nft/interfaces';

export class NftApi {
  async list (userId: string) {
    const data = await http.GET<GetNftsResponse>(`/api/nft/list/${userId}`);

    return data;
  }
}


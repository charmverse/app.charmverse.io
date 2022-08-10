import * as http from 'adapters/http';
import { NftData } from 'lib/nft/types';

export class NftApi {
  async list (addresses: string[]) {
    const data = await http.GET<NftData[]>('/api/nft/list', {
      addresses
    });

    return data;
  }
}


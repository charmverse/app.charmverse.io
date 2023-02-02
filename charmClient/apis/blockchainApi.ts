import * as http from 'adapters/http';
import type { NftData } from 'lib/blockchain/interfaces';
import type { LoggedInUser } from 'models';

export class BlockchainApi {
  listNFTs(userId: string, { pinned = false }: { pinned?: boolean }) {
    return http.GET<NftData[]>(`/api/nft/list/${userId}`, { pinned });
  }

  refreshENSName(address: string) {
    return http.POST<LoggedInUser>(`/api/nft/refresh-ensname`, { address });
  }
}

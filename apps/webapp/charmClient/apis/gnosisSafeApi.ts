import type { UserGnosisSafe } from '@charmverse/core/prisma-client';
import * as http from '@packages/adapters/http';

export class GnosisSafeApi {
  setMyGnosisSafes(wallets: Partial<UserGnosisSafe>[]): Promise<UserGnosisSafe[]> {
    return http.POST('/api/profile/gnosis-safes', wallets);
  }

  getMyGnosisSafes(): Promise<UserGnosisSafe[]> {
    return http.GET('/api/profile/gnosis-safes');
  }

  updateMyGnosisSafe(wallet: { id: string; name?: string; isHidden?: boolean }): Promise<UserGnosisSafe[]> {
    return http.PUT(`/api/profile/gnosis-safes/${wallet.id}`, wallet);
  }

  deleteMyGnosisSafe(walletId: string) {
    return http.DELETE(`/api/profile/gnosis-safes/${walletId}`);
  }
}

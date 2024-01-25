import type { UserWallet } from '@charmverse/core/prisma-client';

import type { MaybeString } from './helpers';
import { useGET, usePUT } from './helpers';

export function getPrimaryWalletKey(userId: MaybeString) {
  return userId ? `/api/wallets/primary` : null;
}

export function useGetPrimaryWallet(userId: MaybeString) {
  return useGET<UserWallet | null>(getPrimaryWalletKey(userId), { userId });
}

export function useSetPrimaryWallet() {
  return usePUT<{ walletId: string }, UserWallet | null>(`/api/wallets/primary`);
}

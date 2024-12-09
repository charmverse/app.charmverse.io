import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { useGETImmutable, useGETtrigger } from '../helpers';

export function useGetUser() {
  return useGETImmutable<SessionUser | null>('/api/session/user');
}

export function useGetUserTrigger() {
  return useGETtrigger<undefined, SessionUser | null>('/api/session/user');
}

// persist the wallet address for this user or return an error if it belongs to someone else
export function useUserWalletAddress(address?: string) {
  return useGETImmutable(address ? `/api/session/wallet` : null, { address });
}

export function useGetClaimablePoints() {
  return useGETImmutable<{ points: number }>(
    '/api/session/claimable-points',
    {},
    {
      refreshInterval: 30000
    }
  );
}

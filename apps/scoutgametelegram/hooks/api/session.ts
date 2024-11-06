import { useGETImmutable, useGETtrigger } from '@root/charmclient/hooks/helpers';

import type { SessionUser } from 'lib/session/interfaces';

export function useGetUser() {
  return useGETImmutable<SessionUser | null>('/api/session/user');
}

export function useGetUserTrigger() {
  return useGETtrigger<undefined, SessionUser | null>('/api/session/user');
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

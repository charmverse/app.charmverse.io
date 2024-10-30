import type { PendingNftTransaction } from '@charmverse/core/prisma-client';
import type { SWRConfiguration } from 'swr';

import type { SessionUser } from 'lib/session/getUserFromSession';

import { useGETImmutable, useGETtrigger } from './helpers';

export function useRefreshUserProfiles() {
  return useGETImmutable<[]>('/api/session/refresh');
}

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

export function useGetPendingNftTransactions<
  T = Pick<PendingNftTransaction, 'id' | 'status' | 'destinationChainTxHash'>[]
>(
  apiKey: boolean,
  // eslint-disable-next-line default-param-last
  query: any = {},
  swrOptions?: SWRConfiguration<T>
) {
  return useGETImmutable<T>(apiKey ? '/api/session/pending-transactions' : null, query, swrOptions);
}

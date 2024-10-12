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
  return useGETImmutable<{ points: number }>('/api/session/claimable-points');
}

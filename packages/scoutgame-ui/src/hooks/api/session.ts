import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { useGETImmutable, useGETtrigger } from '../helpers';

export function useGetUser() {
  return useGETImmutable<SessionUser | null>('/api/session/user');
}

export function useGetUserTrigger() {
  return useGETtrigger<undefined, SessionUser | null>('/api/session/user');
}
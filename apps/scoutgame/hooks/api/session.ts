import type { SessionUser } from 'lib/session/getUserFromSession';

import { useGETImmutable } from './helpers';

export function useRefreshUser() {
  return useGETImmutable<[]>('/api/session/refresh');
}

export function useGetUser() {
  return useGETImmutable<SessionUser | null>('/api/session/user');
}

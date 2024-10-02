import { useGETImmutable } from './helpers';

export function useRefreshUser() {
  return useGETImmutable<[]>('/api/session/refresh');
}

export function useGetUser() {
  return useGETImmutable<[]>('/api/session/user');
}

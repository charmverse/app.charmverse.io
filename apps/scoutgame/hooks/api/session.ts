import { useGETImmutable } from './helpers';

export function useRefreshUser() {
  return useGETImmutable<[]>('/api/session/refresh');
}

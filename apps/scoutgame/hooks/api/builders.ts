import { useGETImmutable } from './helpers';

export function useSearchBuilders(username: string) {
  return useGETImmutable<[]>('/api/builders/search', {
    username
  });
}

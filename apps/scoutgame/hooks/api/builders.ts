import { useGETImmutable } from './helpers';

export function useSearchBuilders(username: string) {
  return useGETImmutable<[]>(username ? '/api/builders/search' : null, {
    username
  });
}

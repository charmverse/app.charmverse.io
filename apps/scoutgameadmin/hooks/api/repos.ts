import type { Repo } from 'lib/repos/getRepos';

import { useGETImmutable, usePOST } from './helpers';

export function useSearchRepos(searchString: string) {
  return useGETImmutable<Repo[]>(searchString ? '/api/repos' : null, { searchString });
}

export function useCreateRepos() {
  return usePOST<{ owner: string }>('/api/repos');
}

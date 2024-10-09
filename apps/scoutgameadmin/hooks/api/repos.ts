import type { Repo } from 'lib/repos/getRepos';

import { useGETImmutable, usePOST } from './helpers';

export function useSearchRepos(searchString: string) {
  return useGETImmutable<Repo[]>(searchString ? '/api/repos' : null, { searchString });
}

export function useGetReposByOwner(owner: string) {
  return useGETImmutable<{ owner: string; name: string }[]>(owner ? '/api/repos/search' : null, { owner });
}

export function useCreateRepo() {
  return usePOST<{ owner: string }>('/api/repos');
}

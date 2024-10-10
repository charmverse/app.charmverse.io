import type { Repo } from 'lib/repos/getRepos';

import type { RepoSearchResult } from '../../app/api/github/search-repos/route';

import { useGETImmutable, usePOST } from './helpers';

export function useSearchRepos(searchString: string) {
  return useGETImmutable<Repo[]>(searchString ? '/api/repos' : null, { searchString });
}

export function useSearchReposByOwnerFromGithub(owner: string) {
  return useGETImmutable<RepoSearchResult[]>(owner ? '/api/github/search-repos' : null, { owner });
}

export function useCreateRepo() {
  return usePOST<{ owner: string }>('/api/repos');
}

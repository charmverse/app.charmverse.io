import type { Repo } from 'lib/repos/getRepos';

import type { RepoSearchResult } from '../../app/api/github/search-repos/route';
import type { GithubUserStats } from '../../app/api/github/user-stats/route';

import { useGETImmutable, usePOST } from './helpers';

export function useSearchReposByOwnerFromGithub(owner: string) {
  return useGETImmutable<RepoSearchResult[]>(owner ? '/api/github/search-repos' : null, { owner });
}

export function useGetGithubUserStats(login: string | null) {
  return useGETImmutable<GithubUserStats>(login ? '/api/github/user-stats' : null, { login });
}

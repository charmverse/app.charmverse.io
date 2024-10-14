import type { Endpoints } from '@octokit/types';

import { octokit } from './octokit';

export type Commit = Endpoints['GET /search/commits']['response']['data']['items'][number];

export async function getCommitsByUser({ login, after }: { login: string; after: Date }) {
  const query = `author:${login} committer-date:>=${after.toISOString()}`;

  const response = await octokit.paginate<Commit>('GET /search/commits', {
    q: query,
    sort: 'committer-date',
    order: 'desc',
    per_page: 100
  });
  return response;
}

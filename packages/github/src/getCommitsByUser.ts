import type { Endpoints } from '@octokit/types';

import { octokit } from './client';

export type Commit = Endpoints['GET /search/commits']['response']['data']['items'][number];

export async function getCommitsByUser({
  login,
  after,
  paginated
}: {
  login: string;
  after: Date;
  paginated?: boolean;
}) {
  const query = `author:${login} committer-date:>=${after.toISOString()}`;
  if (paginated) {
    const response = await octokit.paginate<Commit>('GET /search/commits', {
      q: query,
      sort: 'committer-date',
      order: 'desc',
      per_page: 100
    });
    return response;
  }
  const response = await octokit.request('GET /search/commits', {
    q: query,
    sort: 'committer-date',
    order: 'desc'
  });
  return response.data.items;
}

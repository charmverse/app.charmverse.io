import { randomLargeInt } from '@packages/scoutgame/testing/generators';

import type { PullRequest } from '../tasks/processBuilderActivity/getBuilderActivity';

export function mockPullRequest(
  fields: Partial<Omit<PullRequest, 'repository'>> & {
    githubUser?: { id: number; login: string };
    repo?: { id?: number; owner: string; name: string };
  } = {}
): PullRequest {
  const owner = fields.repo?.owner ?? 'test';
  const name = fields.repo?.name ?? 'test';
  const state = fields.state ?? 'MERGED';
  return {
    title: 'Test PR',
    url: `https://github.com/${owner}/${name}/pull/${randomLargeInt()}`,
    state,
    author: fields.githubUser ?? {
      id: randomLargeInt(),
      login: 'testuser'
    },
    number: randomLargeInt(),
    baseRefName: 'main',
    closedAt: state === 'CLOSED' ? new Date().toISOString() : undefined,
    mergedAt: state === 'MERGED' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    repository: {
      databaseId: fields.repo?.id ?? randomLargeInt(),
      id: fields.repo?.id ?? randomLargeInt(),
      name,
      owner: {
        login: owner
      },
      defaultBranchRef: {
        name: 'main'
      },
      nameWithOwner: `${owner}/${name}`
    },
    ...fields
  };
}

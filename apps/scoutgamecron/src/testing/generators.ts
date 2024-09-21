import type { PullRequest } from '../tasks/processPullRequests/getPullRequests';

export const randomLargeInt = () => Math.floor(Math.random() * 1000000000) + 1000000000;

export function mockPullRequest(
  fields: Partial<PullRequest> & {
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
      id: fields.repo?.id ?? randomLargeInt(),
      nameWithOwner: `${owner}/${name}`
    },
    ...fields
  };
}

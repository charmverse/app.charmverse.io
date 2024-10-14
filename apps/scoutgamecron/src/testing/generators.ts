import { randomLargeInt } from '@packages/scoutgame/testing/generators';

import type { Commit } from '../tasks/processBuilderActivity/github/getCommitsByUser';
import type { PullRequest } from '../tasks/processBuilderActivity/github/getPullRequestsByUser';

export function mockPullRequest(
  fields: Partial<Omit<PullRequest, 'repository'>> & {
    githubUser?: { id: number; login: string };
    repo?: { id?: number; owner: string; name: string };
    sha?: string;
  } = {}
): PullRequest {
  const owner = fields.repo?.owner ?? `owner-${Math.random()}`;
  const name = fields.repo?.name ?? `name-${Math.random()}`;
  const state = fields.state ?? 'MERGED';
  return {
    title: 'Test PR',
    url: `https://github.com/${owner}/${name}/pull/${randomLargeInt()}`,
    state,
    author: fields.githubUser ?? {
      id: randomLargeInt(),
      login: `testuser-${Math.random()}`
    },
    number: randomLargeInt(),
    baseRefName: 'main',
    closedAt: state === 'CLOSED' ? new Date().toISOString() : undefined,
    mergedAt: state === 'MERGED' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    mergeCommit: fields.sha
      ? {
          oid: fields.sha
        }
      : undefined,
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

export function mockCommit(
  fields: {
    createdAt?: string;
    completedAt?: string;
    message?: string;
    sha?: string;
    author?: { id: number; login: string };
    repo?: { id: number; owner: string; name: string };
  } = {}
): Commit {
  const owner = fields.repo?.owner ?? `owner-${Math.random()}`;
  const name = fields.repo?.name ?? `name-${Math.random()}`;
  return {
    sha: fields.sha || Math.random().toString(),
    author:
      fields.author ??
      ({
        id: randomLargeInt(),
        login: `user-${Math.random()}`
      } as Commit['author']),
    commit: {
      author: {
        name: '',
        email: '',
        date: fields.createdAt ?? new Date().toISOString()
      },
      committer: {
        date: fields.completedAt ?? new Date().toISOString()
      },
      message: 'some commit message'
    } as Commit['commit'],
    repository: {
      id: fields.repo?.id ?? randomLargeInt(),
      full_name: `${name}/${owner}`,
      name,
      owner: {
        login: owner
      } as Commit['repository']['owner'],
      default_branch: 'main'
    } as Commit['repository'],
    html_url: 'http://github.com/x/y/test_commit'
  } as Commit;
}

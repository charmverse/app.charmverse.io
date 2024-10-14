import { randomLargeInt } from '@packages/scoutgame/testing/generators';

import type { Commit } from '../tasks/processBuilderActivity/github/getCommitsByUser';
import type { PullRequest } from '../tasks/processBuilderActivity/github/getPullRequestsByUser';

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

export function mockCommit(
  fields: {
    createdAt?: Date;
    completedAt?: Date;
    message?: string;
    sha?: string;
    githubUser?: { id: number; login: string };
    repo?: { id: number; owner: string; name: string };
  } = {}
): Commit {
  const owner = fields.repo?.owner ?? 'test';
  const name = fields.repo?.name ?? 'test';
  return {
    sha: fields.sha || Math.random().toString(),
    author:
      fields.githubUser ??
      ({
        id: randomLargeInt(),
        login: 'testuser'
      } as Commit['author']),
    commit: {
      author: {
        name: '',
        email: '',
        date: (fields.completedAt ?? new Date()).toISOString()
      },
      message: 'some commit message'
    } as Commit['commit'],
    committer: {
      date: (fields.completedAt ?? new Date()).toISOString()
    },
    repository: {
      id: fields.repo?.id ?? randomLargeInt(),
      name,
      owner: {
        login: owner
      } as Commit['repository']['owner'],
      default_branch: 'main'
    } as Commit['repository'],
    html_url: 'http://github.com/x/y/test_commit'
  } as Commit;
}

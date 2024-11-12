import { prisma } from '@charmverse/core/prisma-client';
import { uniqBy } from 'lodash-es';

import type { Commit } from './github/getCommitsByUser';
import { getCommitsByUser } from './github/getCommitsByUser';
import type { PullRequest } from './github/getPullRequestsByUser';
import { getPullRequestsByUser } from './github/getPullRequestsByUser';

export type BuilderActivities = {
  commits: Commit[];
  pullRequests: PullRequest[];
  newOwnerRepos: {
    id: number;
    name: string;
    default_branch?: string | null;
    owner: {
      login: string;
    };
    full_name?: string | null;
  }[];
};

export async function getBuilderActivity({
  login,
  githubUserId,
  after
}: {
  login: string;
  githubUserId?: number;
  after: Date;
}): Promise<BuilderActivities> {
  const commits = await getCommitsByUser({
    login,
    after
  });

  const pullRequests = await getPullRequestsByUser({
    login,
    githubUserId,
    after
  });
  const prRepoIds = pullRequests.map((node) => node.repository.id);
  const commitRepoIds = commits.map((node) => node.repository.id);
  const reposToTrack = await prisma.githubRepo.findMany({
    where: {
      deletedAt: null,
      id: {
        in: [...prRepoIds, ...commitRepoIds]
      }
    }
  });

  return {
    // Filter out PRs we do not follow
    pullRequests: pullRequests.filter((node) => reposToTrack.some((r) => r.id === node.repository.id)),
    commits: commits.filter((node) => reposToTrack.some((r) => r.id === node.repository.id)),
    newOwnerRepos: []
  };
}

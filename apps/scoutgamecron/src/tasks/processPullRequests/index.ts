import type { GithubUser } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { PullRequest } from './getPullRequests';
import { getRecentClosedOrMergedPRs } from './getPullRequests';
import { processClosedPullRequests } from './processClosedPullRequests';
import { processMergedPullRequests } from './processMergedPullRequests';

export async function processPullRequests() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const githubRepos = await prisma.githubRepo.findMany();
  const githubUsers = await prisma.githubUser.findMany({
    select: {
      id: true,
      builder: {
        select: {
          id: true
        }
      }
    }
  });
  const githubUsersRecord: Record<
    string,
    {
      id: number;
      builderId?: string;
    }
  > = {};

  for (const user of githubUsers) {
    githubUsersRecord[user.id] = {
      id: user.id,
      builderId: user.builder?.id
    };
  }

  for (const repo of githubRepos) {
    // console.log('Processing pull requests');
    const recentPrs = await getRecentClosedOrMergedPRs({
      owner: repo.owner,
      repo: repo.name,
      after: last24Hours
    });

    const githubUserPrRecord: Record<
      string,
      { closed: PullRequest[]; merged: PullRequest[]; githubUserId: number; builderId?: string }
    > = {};
    for (const pr of recentPrs) {
      const user = githubUsersRecord[pr.author.login];
      if (user) {
        if (!githubUserPrRecord[user.id]) {
          githubUserPrRecord[user.id] = { closed: [], merged: [], githubUserId: user.id, builderId: user.builderId };
        }

        if (pr.state === 'CLOSED') {
          githubUserPrRecord[user.id].closed.push(pr);
        } else if (pr.state === 'MERGED') {
          githubUserPrRecord[user.id].merged.push(pr);
        }
      }
    }

    for (const githubUserPr of Object.values(githubUserPrRecord)) {
      await processClosedPullRequests({
        pullRequests: githubUserPr.closed,
        githubUserId: githubUserPr.githubUserId,
        repoId: repo.id,
        week: '1',
        builderId: githubUserPr.builderId
      });
      await processMergedPullRequests(githubUserPr.merged);
    }
  }
}

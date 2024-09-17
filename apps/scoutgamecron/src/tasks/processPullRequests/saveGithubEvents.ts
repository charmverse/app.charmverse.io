import { prisma } from '@charmverse/core/prisma-client';

import { getRecentClosedOrMergedPRs } from './getPullRequests';

export async function saveGithubEvents() {
  const now = new Date();
  const githubRepos = await prisma.githubRepo.findMany();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const githubUsers = await prisma.githubUser.findMany({
    select: {
      id: true
    }
  });
  const githubUsersRecord: Record<
    string,
    {
      id: number;
    }
  > = {};

  for (const user of githubUsers) {
    githubUsersRecord[user.id] = {
      id: user.id
    };
  }

  for (const repo of githubRepos) {
    const pullRequests = await getRecentClosedOrMergedPRs({
      owner: repo.owner,
      repo: repo.name,
      after: last24Hours
    });

    for (const pullRequest of pullRequests) {
      await prisma.githubEvent.create({
        data: {
          pullRequestNumber: pullRequest.number,
          title: pullRequest.title,
          type: pullRequest.state === 'CLOSED' ? 'closed_pull_request' : 'merged_pull_request',
          createdBy: githubUsersRecord[pullRequest.author.login].id,
          repoId: repo.id
        }
      });
    }
  }
}

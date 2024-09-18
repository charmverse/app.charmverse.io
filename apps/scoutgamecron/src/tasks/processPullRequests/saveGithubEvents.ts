import { prisma } from '@charmverse/core/prisma-client';

import { getRecentClosedOrMergedPRs } from './getPullRequests';

export async function saveGithubEvents() {
  const now = new Date();
  const githubRepos = await prisma.githubRepo.findMany();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const githubUsers = await prisma.githubUser.findMany({
    select: {
      id: true,
      login: true
    }
  });
  const githubUsersRecord: Record<
    string,
    {
      id: string;
    }
  > = {};

  for (const user of githubUsers) {
    githubUsersRecord[user.login] = {
      id: user.id
    };
  }

  for (const repo of githubRepos) {
    for (const pullRequest of pullRequests) {
      const githubUser = githubUsersRecord[pullRequest.author.login];

      if (githubUser) {
        await prisma.githubEvent.upsert({
          where: {
            unique_github_event: {
              pullRequestNumber: pullRequest.number,
              repoId: repo.id,
              createdBy: githubUser.id,
              type: pullRequest.state === 'CLOSED' ? 'closed_pull_request' : 'merged_pull_request'
            }
          },
          create: {
            pullRequestNumber: pullRequest.number,
            title: pullRequest.title,
            type: pullRequest.state === 'CLOSED' ? 'closed_pull_request' : 'merged_pull_request',
            createdBy: githubUser.id,
            repoId: repo.id
          },
          update: {
            title: pullRequest.title
          }
        });
      }
    }
  }
}

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { registerBuilderNFT } from '@packages/scoutgame/builderNfts/registerBuilderNFT';
import { refreshUserStats } from '@packages/scoutgame/refreshUserStats';
import { currentSeason, getDateFromISOWeek } from '@packages/scoutgame/dates';
import { processMergedPullRequest } from '../tasks/processPullRequests/processMergedPullRequest';

export async function approveBuilder({
  githubLogin,
  builderId,
  season
}: {
  githubLogin?: string;
  builderId?: string;
  season: string;
}) {
  if (githubLogin && builderId) {
    throw new Error('Only provide githubLogin or builderId');
  }
  if (githubLogin && builderId) {
    throw new Error('githubLogin or builderId is required');
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId,
      githubUser: githubLogin
        ? {
            some: {
              login: githubLogin
            }
          }
        : undefined
    },
    include: {
      githubUser: true
    }
  });

  builderId = builder.id;

  const githubUser = builder.githubUser[0];

  if (!githubUser) {
    throw new Error(`Builder ${builder.id} : ${builder.displayName} does not have a github user connected`);
  }


  log.info(`Found builder using Github Account ${githubUser.login}`);

  const events = await prisma.githubEvent.findMany({
    where: {
      githubUser: {
        login: githubUser.login
      },
      createdAt: {
        gte: getDateFromISOWeek(season).toJSDate()
      }
    },
    include: {
      repo: true
    }
  });

  for (const pullRequest of events) {
    if (pullRequest.type === 'merged_pull_request') {
      await processMergedPullRequest({
        season,
        pullRequest: {
          ...pullRequest,
          createdAt: new Date(pullRequest.createdAt).toDateString(),
          number: pullRequest.pullRequestNumber,
          author: {
            id: githubUser.id,
            login: githubUser.login
          },
          repository: { id: pullRequest.repo.id, nameWithOwner: `${pullRequest.repo.owner}/${pullRequest.repo.name}` }
        },
        repo: pullRequest.repo
      });
    }
  }

  const scout = await prisma.scout.update({
    where: {
      id: builderId
    },
    data: {
      builderStatus: 'approved'
    }
  });

  await registerBuilderNFT({ builderId: scout.id, season });

  await refreshUserStats({ userId: scout.id });
}


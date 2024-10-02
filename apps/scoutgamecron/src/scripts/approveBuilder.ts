import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { registerBuilderNFT } from '@packages/scoutgame/builderNfts/registerBuilderNFT';
import { refreshUserStats } from '@packages/scoutgame/refreshUserStats';
import { currentSeason, getCurrentWeek, getDateFromISOWeek } from '@packages/scoutgame/dates';
import { processMergedPullRequest } from '../tasks/processPullRequests/processMergedPullRequest';

import { updateBuildersRank } from '../tasks/processPullRequests/updateBuildersRank';

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
      completedAt: {
        gte: getDateFromISOWeek(season).toJSDate()
      }
    },
    include: {
      repo: true
    }
  });

  for (const pullRequest of events) {
    if (pullRequest.type === 'merged_pull_request' && pullRequest) {
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
      }).catch((error) => log.error('Error processing pull request', { error, pullRequest }));
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

const devUsers = {
  mattcasey: {
    id: 305398,
    avatar: 'https://app.charmverse.io/favicon.png'
  },
  ccarella: {
    id: 199823,
    avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/43760426-bca9-406b-4afe-20138acd5f00/rectcrop3'
  },
  Devorein: {
    id: 25636858,
    avatar:
      'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg'
  },
  valentinludu: {
    id: 34683631,
    avatar:
      'https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/42697dc0-35ad-4361-8311-a92702c76062/breaking_wave.jpg'
  },
  motechFR: {
    id: 18669748,
    avatar:
      'https://cdn.charmverse.io/user-content/e0ec0ec8-0c1f-4745-833d-52c448482d9c/0dd0e3c0-821c-49fc-bd1a-7589ada03019/1ff23917d3954f92aed4351b9c8caa36.jpg'
  }
} as const;

async function approveAll() {
  const allBuilders = await prisma.scout.findMany({
    where: {
      githubUser: {
        some: {}
      },
      builderNfts: {
        none: {}
      }
    }
  });

  console.log(allBuilders.length);

  for (const builder of allBuilders) {
    await approveBuilder({
      builderId: builder.id,
      season: currentSeason
    }).catch((err) => {
      log.error(`Error for ${builder.displayName}`);
    });
  }
  await updateBuildersRank({ week: getCurrentWeek() });
}

// approveAll()

import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason, getCurrentWeek } from '../dates';

export type UnclaimedPointsSource = {
  builders: {
    id: string;
    avatar: string | null;
    displayName: string;
  }[];
  builderPoints: number;
  scoutPoints: number;
  repos: string[];
};

export async function getUnclaimedPointsSource(userId: string): Promise<UnclaimedPointsSource> {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: { equals: null },
      event: {
        type: {
          in: ['nft_purchase', 'gems_payout']
        },
        season: currentSeason
      },
      value: {
        gt: 0
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          type: true,
          builderId: true,
          githubEvent: {
            select: {
              repo: {
                select: {
                  name: true,
                  owner: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  let builderPoints = 0;
  let scoutPoints = 0;

  const builderIdScoutPointsRecord: Record<string, number> = {};

  for (const receipt of pointsReceipts) {
    const points = receipt.value;

    if (receipt.event.type === 'nft_purchase') {
      builderPoints += points;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        scoutPoints += points;
        if (!builderIdScoutPointsRecord[receipt.event.builderId]) {
          builderIdScoutPointsRecord[receipt.event.builderId] = points;
        }
        builderIdScoutPointsRecord[receipt.event.builderId] += points;
      } else {
        builderPoints += points;
      }
    }
  }

  const topBuilderIds = Object.entries(builderIdScoutPointsRecord)
    .sort((builder1, builder2) => builder2[1] - builder1[1])
    .map(([builderId]) => builderId);

  const builders = await prisma.scout.findMany({
    where: {
      id: { in: topBuilderIds }
    },
    select: {
      id: true,
      avatar: true,
      displayName: true
    }
  });

  const repos = await prisma.githubEvent.findMany({
    where: {
      builderEvent: {
        week: getCurrentWeek(),
        builderId: userId
      }
    },
    select: {
      repo: {
        select: {
          name: true,
          owner: true
        }
      }
    }
  });

  const uniqueRepos = Array.from(new Set(repos.map((repo) => `${repo.repo.owner}/${repo.repo.name}`)));

  return {
    builders: builders.slice(0, 3),
    builderPoints,
    scoutPoints,
    repos: uniqueRepos.slice(0, 3)
  };
}

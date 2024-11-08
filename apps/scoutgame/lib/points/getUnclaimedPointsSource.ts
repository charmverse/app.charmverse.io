import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

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
  const repos: string[] = [];

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
    } else if (
      (receipt.event.type === 'daily_commit' || receipt.event.type === 'merged_pull_request') &&
      receipt.event.githubEvent
    ) {
      const repo = receipt.event.githubEvent.repo;
      repos.push(`${repo.owner}/${repo.name}`);
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

  return {
    builders,
    builderPoints,
    scoutPoints,
    repos
  };
}

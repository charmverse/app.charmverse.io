import { prisma } from '@charmverse/core/prisma-client';

export async function getSeasonBuilderRewards({ userId }: { userId: string }): Promise<
  {
    username: string;
    avatar: string | null;
    points: number;
    rank: null;
  }[]
> {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      event: {
        type: 'gems_payout'
      }
    },
    select: {
      value: true,
      event: {
        select: {
          builderId: true
        }
      }
    }
  });

  const uniqueBuilderIds = Array.from(new Set(pointsReceipts.map((receipt) => receipt.event.builderId)));

  const builders = await prisma.scout.findMany({
    where: {
      id: { in: uniqueBuilderIds }
    },
    select: {
      id: true,
      username: true,
      avatar: true
    }
  });

  const buildersRecord: Record<string, { username: string; avatar: string | null }> = {};
  builders.forEach((builder) => {
    buildersRecord[builder.id] = {
      username: builder.username,
      avatar: builder.avatar
    };
  });

  const builderRewardsRecord: Record<string, { username: string; avatar: string | null; points: number; rank: null }> =
    {};

  pointsReceipts.forEach((receipt) => {
    const builderId = receipt.event.builderId;
    const builder = buildersRecord[builderId];
    if (builder) {
      if (!builderRewardsRecord[builderId]) {
        builderRewardsRecord[builderId] = {
          username: builder.username,
          avatar: builder.avatar,
          points: 0,
          rank: null
        };
      }
      builderRewardsRecord[builderId].points += receipt.value;
    }
  });

  return Object.values(builderRewardsRecord).sort((a, b) => b.points - a.points);
}

export async function getWeeklyBuilderRewards({ userId, week }: { userId: string; week: string }): Promise<
  {
    rank: number | null;
    username: string;
    avatar: string | null;
    points: number;
  }[]
> {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      event: {
        week,
        type: 'gems_payout'
      }
    },
    select: {
      value: true,
      event: {
        select: {
          builder: {
            select: {
              id: true,
              username: true,
              avatar: true,
              userWeeklyStats: {
                where: {
                  week
                },
                select: {
                  rank: true
                }
              }
            }
          }
        }
      }
    }
  });

  return pointsReceipts
    .map((receipt) => {
      const builder = receipt.event.builder;
      return {
        rank: builder.userWeeklyStats[0]?.rank || null,
        username: builder.username,
        avatar: builder.avatar,
        points: receipt.value
      };
    })
    .sort((a, b) => b.points - a.points);
}

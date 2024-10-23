import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { isTruthy } from '@root/lib/utils/types';

type BuilderReward = {
  username: string;
  avatar: string | null;
  points: number;
  rank: number | null;
  cardsHeld: number;
};

export async function getSeasonBuilderRewards({ userId }: { userId: string }): Promise<BuilderReward[]> {
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

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId: userId
    },
    select: {
      builderNFT: {
        select: {
          builderId: true
        }
      },
      tokensPurchased: true
    }
  });

  const builderTokensRecord: Record<string, number> = {};

  nftPurchaseEvents.forEach((event) => {
    const builderId = event.builderNFT.builderId;
    builderTokensRecord[builderId] = (builderTokensRecord[builderId] || 0) + event.tokensPurchased;
  });

  const buildersRecord: Record<string, Omit<BuilderReward, 'points' | 'rank'>> = {};
  builders.forEach((builder) => {
    const cardsHeld = builderTokensRecord[builder.id] || 0;
    if (cardsHeld) {
      buildersRecord[builder.id] = {
        username: builder.username,
        avatar: builder.avatar,
        cardsHeld
      };
    }
  });

  const builderRewardsRecord: Record<string, BuilderReward> = {};

  pointsReceipts.forEach((receipt) => {
    const builderId = receipt.event.builderId;
    const builder = buildersRecord[builderId];
    if (builder) {
      if (!builderRewardsRecord[builderId]) {
        builderRewardsRecord[builderId] = {
          username: builder.username,
          avatar: builder.avatar,
          cardsHeld: builder.cardsHeld,
          points: 0,
          rank: null
        };
      }
      builderRewardsRecord[builderId].points += receipt.value;
    }
  });

  return Object.values(builderRewardsRecord).sort((a, b) => b.points - a.points);
}

export async function getWeeklyBuilderRewards({
  userId,
  week
}: {
  userId: string;
  week: string;
}): Promise<BuilderReward[]> {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      value: {
        gt: 0
      },
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

  const uniqueBuilderIds = Array.from(new Set(pointsReceipts.map((receipt) => receipt.event.builder.id)));

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId: userId,
      builderEvent: {
        week: {
          lte: week
        }
      },
      builderNFT: {
        builderId: { in: uniqueBuilderIds },
        season: currentSeason
      }
    },
    select: {
      builderNFT: {
        select: {
          builderId: true
        }
      },
      tokensPurchased: true
    }
  });

  const builderTokensRecord: Record<string, number> = {};

  nftPurchaseEvents.forEach((event) => {
    const builderId = event.builderNFT.builderId;
    builderTokensRecord[builderId] = (builderTokensRecord[builderId] || 0) + event.tokensPurchased;
  });

  return pointsReceipts
    .map((receipt) => {
      const builder = receipt.event.builder;
      const cardsHeld = builderTokensRecord[builder.id] || 0;
      const rank = builder.userWeeklyStats[0]?.rank || null;
      if (rank === null || cardsHeld === 0) {
        return null;
      }
      return {
        rank,
        username: builder.username,
        avatar: builder.avatar,
        points: receipt.value,
        cardsHeld
      };
    })
    .filter(isTruthy)
    .sort((a, b) => b.points - a.points);
}

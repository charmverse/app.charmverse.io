import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';

import { currentSeason } from '../dates';

export type BuilderReward = {
  path: string;
  displayName: string;
  avatar: string | null;
  points: number;
  rank: number | null;
  cardsHeld: number;
};

export async function getSeasonBuilderRewards({ userId }: { userId: string }): Promise<BuilderReward[]> {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      nftPurchaseEvents: {
        where: {
          builderNft: {
            season: currentSeason
          }
        },
        select: {
          builderNft: {
            select: {
              builderId: true
            }
          },
          tokensPurchased: true
        }
      },
      pointsReceived: {
        where: {
          event: {
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
                  path: true,
                  displayName: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    }
  });

  const builderTokensRecord: Record<string, number> = {};

  scout.nftPurchaseEvents.forEach((event) => {
    const builderId = event.builderNft.builderId;
    builderTokensRecord[builderId] = (builderTokensRecord[builderId] || 0) + event.tokensPurchased;
  });

  const builderRewardsRecord: Record<string, BuilderReward> = {};

  scout.pointsReceived.forEach((receipt) => {
    const builder = receipt.event.builder;
    const builderId = builder.id;
    const cardsHeld = builderTokensRecord[builderId] || 0;
    if (cardsHeld) {
      if (!builderRewardsRecord[builderId]) {
        builderRewardsRecord[builderId] = {
          path: builder.path,
          displayName: builder.displayName,
          avatar: builder.avatar,
          cardsHeld,
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
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      nftPurchaseEvents: {
        where: {
          builderEvent: {
            week: {
              lte: week
            }
          },
          builderNft: {
            season: currentSeason
          }
        },
        select: {
          builderNft: {
            select: {
              builderId: true
            }
          },
          tokensPurchased: true
        }
      },
      pointsReceived: {
        where: {
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
                  path: true,
                  displayName: true,
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
      }
    }
  });

  const builderTokensRecord: Record<string, number> = {};

  scout.nftPurchaseEvents.forEach((event) => {
    const builderId = event.builderNft.builderId;
    builderTokensRecord[builderId] = (builderTokensRecord[builderId] || 0) + event.tokensPurchased;
  });

  return scout.pointsReceived
    .map((receipt) => {
      const builder = receipt.event.builder;
      const cardsHeld = builderTokensRecord[builder.id];
      const rank = builder.userWeeklyStats[0]?.rank || null;
      if (rank === null || !cardsHeld || cardsHeld === 0) {
        return null;
      }
      return {
        rank,
        path: builder.path,
        avatar: builder.avatar,
        points: receipt.value,
        cardsHeld,
        displayName: builder.displayName
      };
    })
    .filter(isTruthy)
    .sort((a, b) => b.points - a.points);
}

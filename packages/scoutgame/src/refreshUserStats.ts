import type { Prisma, UserSeasonStats, UserWeeklyStats } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

import { currentSeason, getCurrentWeek } from './utils';

export async function refreshUserStats({
  userId
}: {
  userId: string;
}): Promise<{ weekly: UserWeeklyStats; season: UserSeasonStats }> {
  const week = getCurrentWeek();

  const userGems = await prisma.gemsPayoutEvent.count({
    where: {
      builderId: userId
    }
  });

  const weekly = await prisma.userWeeklyStats.upsert({
    where: {
      userId_week: {
        userId,
        week
      }
    },
    create: {
      userId,
      season: currentSeason,
      week,
      gemsCollected: userGems
    },
    update: {
      gemsCollected: userGems
    }
  });

  const allTimePointsAsScount = await prisma.pointsReceipt.count({
    where: {
      recipientId: userId,
      event: {
        OR: [
          {
            githubEvent: {
              githubUser: {
                builderId: {
                  not: userId
                }
              }
            }
          }
        ]
      }
    },
    select: {
      id: true
    }
  });

  const allTimeBuilderNftPoints = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      event: {
        githubEvent: {
          githubUser: {
            builderId: userId
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  const builderNft = await prisma.builderNft.findFirst({
    where: {
      season: currentSeason,
      builderId: userId
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutId: true,
          tokensPurchased: true
        }
      }
    }
  });

  const nftsBought = await prisma.nFTPurchaseEvent.count({
    where: {
      scoutId: userId,
      builderNFT: {
        season: currentSeason
      }
    }
  });

  const seasonStats = {
    pointsEarnedAsBuilder: allTimeBuilderNftPoints.length,
    pointsEarnedAsScout: 0,
    season: currentSeason,
    nftsPurchased: nftsBought,
    nftsSold: builderNft?.nftSoldEvents.length,
    nftOwners: builderNft ? arrayUtils.uniqueValues(builderNft.nftSoldEvents.map((ev) => ev.scoutId)).length : undefined
  };

  const season = await prisma.userSeasonStats.upsert({
    where: {
      userId_season: {
        season: currentSeason,
        userId
      }
    },
    create: {
      ...seasonStats,
      lastUpdated: new Date(),
      user: {
        connect: {
          id: userId
        }
      }
    },
    update: {
      ...seasonStats
    }
  });

  return {
    weekly,
    season
  };
}

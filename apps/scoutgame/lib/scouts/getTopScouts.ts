import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export type TopScout = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  buildersScouted: number;
  nftsHeld: number;
  allTimePoints?: number;
  seasonPoints?: number;
};

export async function getTopScouts({ limit }: { limit: number }): Promise<TopScout[]> {
  const topScouts = await prisma.userSeasonStats.findMany({
    where: {
      season: currentSeason
    },
    orderBy: {
      pointsEarnedAsScout: 'desc'
    },
    take: limit,
    select: {
      pointsEarnedAsScout: true,
      user: {
        select: {
          id: true,
          path: true,
          displayName: true,
          avatar: true,
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
              }
            }
          },
          userAllTimeStats: {
            select: {
              pointsEarnedAsScout: true
            }
          },
          userSeasonStats: {
            where: {
              season: currentSeason
            },
            select: {
              nftsPurchased: true
            }
          }
        }
      }
    }
  });
  return topScouts
    .map((scout) => {
      const buildersScouted = Array.from(
        new Set(scout.user.nftPurchaseEvents.map((event) => event.builderNFT.builderId))
      ).length;
      const nftsHeld = scout.user.userSeasonStats[0]?.nftsPurchased || 0;
      const allTimePoints = scout.user.userAllTimeStats[0]?.pointsEarnedAsScout || 0;
      const seasonPoints = scout.pointsEarnedAsScout;
      return {
        id: scout.user.id,
        path: scout.user.path,
        displayName: scout.user.displayName,
        avatar: scout.user.avatar,
        buildersScouted,
        nftsHeld,
        allTimePoints,
        seasonPoints
      };
    })
    .sort((a, b) => {
      const seasonPointsDifference = b.seasonPoints - a.seasonPoints;
      if (seasonPointsDifference !== 0) {
        return seasonPointsDifference;
      }
      const allTimePointsDifference = b.allTimePoints - a.allTimePoints;
      if (allTimePointsDifference !== 0) {
        return allTimePointsDifference;
      }
      const nftsHeldDifference = b.nftsHeld - a.nftsHeld;
      if (nftsHeldDifference !== 0) {
        return nftsHeldDifference;
      }
      return 0;
    })
    .filter((scout) => scout.seasonPoints || scout.allTimePoints || scout.nftsHeld);
}

// TODO: cache the pointsEarned as part of userWeeklyStats like we do in userSeasonStats
export async function getTopScoutsByWeek({ week, limit = 10 }: { week: string; limit?: number }) {
  const receipts = await prisma.pointsReceipt.findMany({
    where: {
      event: {
        type: 'gems_payout',
        season: currentSeason,
        week
      }
    },
    include: {
      event: {
        include: { gemsPayoutEvent: true }
      }
    }
  });
  const scoutReceipts = receipts.filter((receipt) => receipt.event.builderId !== receipt.recipientId);
  // create a map of userId to pointsEarned
  const pointsEarnedByUserId = scoutReceipts.reduce<Record<string, number>>((acc, receipt) => {
    acc[receipt.recipientId!] = (acc[receipt.recipientId!] || 0) + receipt.value;
    return acc;
  }, {});
  // create a list of users sorted by pointsEarned
  const sortedUsers = Object.entries(pointsEarnedByUserId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const users = await prisma.scout.findMany({
    where: {
      id: {
        in: sortedUsers.map((user) => user[0])
      }
    }
  });

  return sortedUsers.map((user) => ({
    ...users.find((u) => u.id === user[0]),
    pointsEarned: pointsEarnedByUserId[user[0]]
  }));
}

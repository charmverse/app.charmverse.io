import type { UserWeeklyStats } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek, getStartOfWeek } from '@packages/scoutgame/dates';

export type NewScout = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  builderGemsCollected: number;
  buildersScouted: number;
  nftsHeld: number;
};

export async function getNewScouts({ limit }: { limit: number }): Promise<NewScout[]> {
  const week = getCurrentWeek();
  const startOfWeek = getStartOfWeek(week);
  const [weeklyStats, newScouts] = await prisma.$transaction([
    prisma.userWeeklyStats.findMany({
      where: {
        week,
        season: currentSeason
      }
    }),
    prisma.scout.findMany({
      where: {
        createdAt: {
          gt: startOfWeek.toJSDate()
        },
        nftPurchaseEvents: {
          some: {}
        }
      },
      take: limit,
      select: {
        id: true,
        path: true,
        displayName: true,
        avatar: true,
        nftPurchaseEvents: {
          where: {
            builderNFT: {
              builder: {
                builderStatus: 'approved'
              },
              season: currentSeason
            }
          },
          select: {
            builderNFT: {
              select: {
                builderId: true
              }
            }
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
    })
  ]);
  const weeklyStatsByUserId = weeklyStats.reduce<Record<string, UserWeeklyStats>>((acc, stat) => {
    acc[stat.userId] = stat;
    return acc;
  }, {});
  return newScouts
    .map((scout): NewScout => {
      const buildersScouted = Array.from(new Set(scout.nftPurchaseEvents.map((event) => event.builderNFT.builderId)));
      const nftsHeld = scout.userSeasonStats[0]?.nftsPurchased || 0;
      const builderGemsCollected = buildersScouted
        .map((builderId) => weeklyStatsByUserId[builderId]?.gemsCollected || 0)
        .reduce((acc, curr) => acc + curr, 0);
      return {
        id: scout.id,
        path: scout.path,
        displayName: scout.displayName,
        avatar: scout.avatar,
        buildersScouted: buildersScouted.length,
        builderGemsCollected,
        nftsHeld
      };
    })
    .sort((a, b) => {
      return b.builderGemsCollected - a.builderGemsCollected;
    });
}

// TODO: cache the pointsEarned as part of userWeeklyStats like we do in userSeasonStats
export async function getnewScoutsByWeek({ week, limit = 10 }: { week: string; limit?: number }) {
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

import type { UserWeeklyStats } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

export type NewScout = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  builderGemsCollected: number;
  buildersScouted: number;
  nftsHeld: number;
};

// look at gems instead of points for current week
export async function getRankedNewScoutsForCurrentWeek({
  week = getCurrentWeek(),
  season = currentSeason
}: {
  week?: string;
  season?: string;
} = {}): Promise<NewScout[]> {
  const [weeklyStats, newScouts] = await Promise.all([
    prisma.userWeeklyStats.findMany({
      where: {
        week,
        season
      }
    }),
    getNewScouts({ week, season })
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
export async function getRankedNewScoutsForPastWeek({
  week,
  season = currentSeason
}: {
  week: string;
  season?: string;
}) {
  const [receipts, newScouts] = await Promise.all([
    prisma.pointsReceipt.findMany({
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
    }),
    getNewScouts({ week, season })
  ]);
  // remove receipts for builder payout
  const scoutReceipts = receipts.filter((receipt) => receipt.event.builderId !== receipt.recipientId);
  // create a map of userId to pointsEarned
  const pointsEarnedByUserId = scoutReceipts.reduce<Record<string, number>>((acc, receipt) => {
    acc[receipt.recipientId!] = (acc[receipt.recipientId!] || 0) + receipt.value;
    return acc;
  }, {});
  // create a list of users sorted by pointsEarned
  const sortedUsers = Object.entries(pointsEarnedByUserId).sort((a, b) => b[1] - a[1]);
  return (
    sortedUsers
      // only include new scouts
      .filter((user) => newScouts.find((s) => s.id === user[0]))
      .map((user) => ({
        ...newScouts.find((u) => u.id === user[0]),
        pointsEarned: pointsEarnedByUserId[user[0]]
      }))
  );
}

// new Scout definition: only scouts that purchased NFT this week for the first time
export async function getNewScouts({ week, season }: { week: string; season: string }) {
  return prisma.scout.findMany({
    where: {
      nftPurchaseEvents: {
        every: {
          // every nft purchase event must have been purchased this week or later
          builderEvent: {
            week: {
              gte: week
            }
          },
          builderNFT: {
            builder: {
              builderStatus: 'approved'
            }
          }
        },
        // at least one NFT was purchased this week
        some: {
          builderEvent: {
            week
          }
        }
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      avatar: true,
      scoutWallet: {
        select: {
          address: true
        }
      },
      nftPurchaseEvents: {
        where: {
          builderEvent: {
            week,
            season
          },
          builderNFT: {
            builder: {
              builderStatus: 'approved'
            }
          }
        },
        select: {
          builderEvent: {
            select: {
              week: true,
              season: true
            }
          },
          builderNFT: {
            select: {
              builderId: true
            }
          }
        }
      },
      userSeasonStats: {
        where: {
          season
        },
        select: {
          nftsPurchased: true
        }
      }
    }
  });
}

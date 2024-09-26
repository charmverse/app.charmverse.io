import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, currentSeasonStartDate, getSeasonWeekFromISOWeek } from '@packages/scoutgame/utils';

export type WeeklyReward = {
  week: string;
  weekNumber: number;
  builderReward: {
    points: number;
  };
  githubContributionReward: {
    points: number;
    streakCount: number;
    firstContributionsCount: number;
    regularContributionsCount: number;
  };
  soldNftReward: {
    points: number;
    quantity: number;
  };
  rank: number | null;
};

export async function getClaimablePoints(
  userId: string
): Promise<{ totalClaimablePoints: number; weeklyRewards: WeeklyReward[] }> {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        season: currentSeason
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          week: true,
          type: true,
          builderId: true,
          nftPurchaseEvent: {
            select: {
              tokensPurchased: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const totalClaimablePoints = pointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);

  const builderRewards: Record<string, { points: number }> = {};
  const soldNftRewards: Record<string, { points: number; quantity: number }> = {};
  const githubContributionRewards: Record<
    string,
    {
      points: number;
      streakCount: number;
      firstContributionsCount: number;
      regularContributionsCount: number;
    }
  > = {};

  const allWeeks = new Set<string>(Array.from(pointsReceipts.map((receipt) => receipt.event.week)));

  const gemsReceipts = await prisma.gemsReceipt.findMany({
    where: {
      event: {
        week: {
          in: Array.from(allWeeks)
        },
        builderId: userId
      }
    },
    select: {
      type: true,
      event: {
        select: {
          week: true
        }
      }
    }
  });

  const weeklyRankRecord: Record<string, number | null> = {};
  const weeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week: {
        in: Array.from(allWeeks)
      },
      userId
    },
    select: {
      rank: true,
      week: true
    }
  });

  for (const stat of weeklyStats) {
    weeklyRankRecord[stat.week] = stat.rank;
  }

  const weeklyGithubContributionRecord: Record<
    string,
    { firstContributionsCount: number; regularContributionsCount: number; streakCount: number }
  > = {};

  gemsReceipts.forEach(({ type, event: { week } }) => {
    if (!weeklyGithubContributionRecord[week]) {
      weeklyGithubContributionRecord[week] = {
        firstContributionsCount: 0,
        regularContributionsCount: 0,
        streakCount: 0
      };
    }

    if (type === 'first_pr') {
      weeklyGithubContributionRecord[week].firstContributionsCount += 1;
    } else if (type === 'regular_pr') {
      weeklyGithubContributionRecord[week].regularContributionsCount += 1;
    } else if (type === 'third_pr_in_streak') {
      weeklyGithubContributionRecord[week].streakCount += 1;
    }
  });

  for (const receipt of pointsReceipts) {
    const points = receipt.value;
    const week = receipt.event.week;

    if (receipt.event.type === 'nft_purchase' && receipt.event.nftPurchaseEvent) {
      if (!soldNftRewards[week]) {
        soldNftRewards[week] = {
          points: 0,
          quantity: 0
        };
      }
      const soldNftReward = soldNftRewards[week];
      soldNftReward.points += receipt.value;
      soldNftReward.quantity += receipt.event.nftPurchaseEvent.tokensPurchased ?? 1;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        const builderReward = builderRewards[week];
        if (!builderReward) {
          builderRewards[week] = {
            points: 0
          };
        }
        builderReward.points += points;
      } else {
        const githubContribution = weeklyGithubContributionRecord[week];
        if (!githubContributionRewards[week]) {
          githubContributionRewards[week] = {
            points: 0,
            firstContributionsCount: 0,
            regularContributionsCount: 0,
            streakCount: 0
          };
        }
        const githubContributionReward = githubContributionRewards[week];
        githubContributionReward.points += points;
        githubContributionReward.firstContributionsCount += githubContribution?.firstContributionsCount ?? 0;
        githubContributionReward.regularContributionsCount += githubContribution?.regularContributionsCount ?? 0;
        githubContributionReward.streakCount += githubContribution?.streakCount ?? 0;
      }
    }
  }

  return {
    totalClaimablePoints,
    weeklyRewards: Array.from(allWeeks)
      .map((week) => ({
        week,
        weekNumber: getSeasonWeekFromISOWeek({
          seasonStartDate: currentSeasonStartDate,
          week
        }),
        builderReward: builderRewards[week],
        githubContributionReward: githubContributionRewards[week],
        soldNftReward: soldNftRewards[week],
        rank: weeklyRankRecord[week]
      }))
      .sort((a, b) => b.weekNumber - a.weekNumber)
  };
}

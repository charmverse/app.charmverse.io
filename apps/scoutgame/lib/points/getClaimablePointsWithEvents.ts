import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getPreviousSeason, getSeasonWeekFromISOWeek } from '@packages/scoutgame/dates';

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
    bonusPartners: string[];
  };
  soldNftReward: {
    points: number;
    quantity: number;
  };
  rank: number | null;
};

export async function getClaimablePointsWithEvents(
  userId: string
): Promise<{ totalClaimablePoints: number; weeklyRewards: WeeklyReward[]; bonusPartners: string[] }> {
  const previousSeason = getPreviousSeason(currentSeason);
  const claimableSeasons = [previousSeason, currentSeason].filter(Boolean);
  if (claimableSeasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${currentSeason}`);
  }
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        season: {
          in: claimableSeasons
        }
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          week: true,
          season: true,
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
  const githubContributionRewards: Record<string, WeeklyReward['githubContributionReward']> = {};

  const allWeeks = pointsReceipts.reduce<Record<string, string>>((acc, receipt) => {
    acc[receipt.event.week] = receipt.event.season;
    return acc;
  }, {});

  const gemsReceipts = await prisma.gemsReceipt.findMany({
    where: {
      event: {
        week: {
          in: Object.keys(allWeeks)
        },
        builderId: userId
      }
    },
    select: {
      type: true,
      event: {
        select: {
          week: true,
          bonusPartner: true
        }
      }
    }
  });

  const weeklyRankRecord: Record<string, number | null> = {};
  const weeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week: {
        in: Object.keys(allWeeks)
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
    { firstContributionsCount: number; regularContributionsCount: number; streakCount: number; bonusPartners: string[] }
  > = {};

  gemsReceipts.forEach(({ type, event: { week, bonusPartner } }) => {
    if (!weeklyGithubContributionRecord[week]) {
      weeklyGithubContributionRecord[week] = {
        firstContributionsCount: 0,
        regularContributionsCount: 0,
        streakCount: 0,
        bonusPartners: []
      };
    }

    if (type === 'first_pr') {
      weeklyGithubContributionRecord[week].firstContributionsCount += 1;
    } else if (type === 'regular_pr') {
      weeklyGithubContributionRecord[week].regularContributionsCount += 1;
    } else if (type === 'third_pr_in_streak') {
      weeklyGithubContributionRecord[week].streakCount += 1;
    }
    if (bonusPartner) {
      weeklyGithubContributionRecord[week].bonusPartners.push(bonusPartner);
    }
  });

  const bonusPartners: Set<string> = new Set();

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
            streakCount: 0,
            bonusPartners: []
          };
        }
        const githubContributionReward = githubContributionRewards[week];
        githubContributionReward.points += points;
        githubContributionReward.firstContributionsCount += githubContribution?.firstContributionsCount ?? 0;
        githubContributionReward.regularContributionsCount += githubContribution?.regularContributionsCount ?? 0;
        githubContributionReward.streakCount += githubContribution?.streakCount ?? 0;
        githubContributionReward.bonusPartners = githubContribution?.bonusPartners ?? [];
        githubContributionReward.bonusPartners.forEach((partner) => bonusPartners.add(partner));
      }
    }
  }

  return {
    totalClaimablePoints,
    weeklyRewards: Object.keys(allWeeks)
      .map((week) => ({
        week,
        weekNumber: getSeasonWeekFromISOWeek({
          season: allWeeks[week],
          week
        }),
        builderReward: builderRewards[week],
        githubContributionReward: githubContributionRewards[week],
        soldNftReward: soldNftRewards[week],
        rank: weeklyRankRecord[week],
        bonusPartners: githubContributionRewards[week]?.bonusPartners ?? []
      }))
      .sort((a, b) => b.weekNumber - a.weekNumber),
    bonusPartners: Array.from(bonusPartners)
  };
}

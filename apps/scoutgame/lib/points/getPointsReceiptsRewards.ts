import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/scoutgame/dates';
import { currentSeason, getPreviousSeason, getSeasonWeekFromISOWeek, seasonStarts } from '@packages/scoutgame/dates';

export type PointsReceiptRewardType = 'builder' | 'sold_nfts' | 'leaderboard_rank';

type PointsReceiptRewardBase = {
  period: string;
  points: number;
  type: PointsReceiptRewardType;
};

export type BuilderPointsReceiptReward = PointsReceiptRewardBase & {
  type: 'builder';
  bonusPartners: string[];
};

export type SoldNftsPointsReceiptReward = PointsReceiptRewardBase & {
  type: 'sold_nfts';
  quantity: number;
};

export type LeaderboardRankPointsReceiptReward = PointsReceiptRewardBase & {
  type: 'leaderboard_rank';
  rank: number;
};

export type PointsReceiptReward =
  | BuilderPointsReceiptReward
  | SoldNftsPointsReceiptReward
  | LeaderboardRankPointsReceiptReward;

export async function getPointsReceiptsRewards({
  isClaimed,
  userId
}: {
  userId: string;
  isClaimed: boolean;
}): Promise<PointsReceiptReward[]> {
  const previousSeason = getPreviousSeason(currentSeason);
  const seasons = [previousSeason, currentSeason].filter(Boolean);
  if (seasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${currentSeason}`);
  }
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: isClaimed ? { not: null } : { equals: null },
      event: {
        season: {
          // Can only claim points for this season and previous seasons
          in: isClaimed ? seasonStarts : seasons
        }
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
          week: true,
          season: true,
          type: true,
          bonusPartner: true,
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

  const builderRewards: Record<string, BuilderPointsReceiptReward> = {};
  const soldNftRewards: Record<string, SoldNftsPointsReceiptReward> = {};
  const leaderboardRankRewards: Record<string, LeaderboardRankPointsReceiptReward> = {};

  const leaderboardRankWeeks = Array.from(
    new Set(
      pointsReceipts
        .filter((pr) => pr.event.type === 'gems_payout' && pr.recipientId === userId)
        .map((pr) => pr.event.week)
    )
  );

  const weeklyRankRecord: Record<string, number | null> = {};
  const weeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week: {
        in: leaderboardRankWeeks
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

  const bonusPartners: Set<string> = new Set();

  for (const receipt of pointsReceipts) {
    const points = receipt.value;
    const week = receipt.event.week;
    const weeklyRank = weeklyRankRecord[week];
    const seasonIndex = seasonStarts.indexOf(receipt.event.season as Season);
    const weekNumber = getSeasonWeekFromISOWeek({
      season: receipt.event.season,
      week
    });

    const period = seasonIndex < 2 ? `S${seasonIndex - 1} W1` : `S1 W${weekNumber}`;

    if (receipt.event.type === 'nft_purchase' && receipt.event.nftPurchaseEvent) {
      if (!soldNftRewards[period]) {
        soldNftRewards[period] = {
          points: 0,
          quantity: 0,
          period,
          type: 'sold_nfts'
        };
      }
      soldNftRewards[period].points += receipt.value;
      soldNftRewards[period].quantity += receipt.event.nftPurchaseEvent.tokensPurchased;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        if (!builderRewards[period]) {
          builderRewards[period] = {
            points: 0,
            period,
            type: 'builder',
            bonusPartners: []
          };
        }
        builderRewards[period].points += points;
        const bonusPartner = receipt.event.bonusPartner;
        if (bonusPartner) {
          builderRewards[period].bonusPartners.push(bonusPartner);
          bonusPartners.add(bonusPartner);
        }
      } else if (weeklyRank) {
        if (!leaderboardRankRewards[period]) {
          leaderboardRankRewards[period] = {
            points: 0,
            rank: weeklyRank,
            period,
            type: 'leaderboard_rank'
          };
        }
        leaderboardRankRewards[period].points += points;
      }
    }
  }

  return [
    ...Object.values(builderRewards),
    ...Object.values(soldNftRewards),
    ...Object.values(leaderboardRankRewards)
  ].sort((a, b) => {
    if (a.period === b.period) {
      return b.points - a.points;
    }
    return b.period.localeCompare(a.period);
  });
}

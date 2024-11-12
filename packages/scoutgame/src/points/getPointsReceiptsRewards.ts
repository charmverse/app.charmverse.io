import { prisma } from '@charmverse/core/prisma-client';

import type { Season } from '../dates';
import { currentSeason, getPreviousSeason, getSeasonWeekFromISOWeek, seasonStarts } from '../dates';

export type PointsReceiptRewardType = 'builder' | 'sold_nfts' | 'leaderboard_rank';

type PointsReceiptRewardBase = {
  week: number;
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

export type SeasonPointsReceiptsReward = {
  points: number;
  season: string;
  type: 'season';
};

export type PointsReceiptReward =
  | BuilderPointsReceiptReward
  | SoldNftsPointsReceiptReward
  | LeaderboardRankPointsReceiptReward
  | SeasonPointsReceiptsReward;

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

  const devSeasonPointsReceipts = pointsReceipts.filter((pr) => seasonStarts.indexOf(pr.event.season as Season) === 0);
  const preSeasonPointsReceipts = pointsReceipts.filter((pr) => seasonStarts.indexOf(pr.event.season as Season) === 1);
  const seasonPointsReceipts = pointsReceipts.filter((pr) => seasonStarts.indexOf(pr.event.season as Season) === 2);

  const devSeasonTotalPoints = devSeasonPointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);
  const preSeasonTotalPoints = preSeasonPointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);

  for (const receipt of seasonPointsReceipts) {
    const points = receipt.value;
    const week = receipt.event.week;
    const weeklyRank = weeklyRankRecord[week];
    const weekNumber = getSeasonWeekFromISOWeek({
      season: receipt.event.season,
      week
    });

    if (receipt.event.type === 'nft_purchase' && receipt.event.nftPurchaseEvent) {
      if (!soldNftRewards[week]) {
        soldNftRewards[week] = {
          points: 0,
          quantity: 0,
          week: weekNumber,
          type: 'sold_nfts'
        };
      }
      soldNftRewards[week].points += receipt.value;
      soldNftRewards[week].quantity += receipt.event.nftPurchaseEvent.tokensPurchased;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        if (!builderRewards[week]) {
          builderRewards[week] = {
            points: 0,
            week: weekNumber,
            type: 'builder',
            bonusPartners: []
          };
        }
        builderRewards[week].points += points;
        const bonusPartner = receipt.event.bonusPartner;
        if (bonusPartner) {
          builderRewards[week].bonusPartners.push(bonusPartner);
          bonusPartners.add(bonusPartner);
        }
      } else if (weeklyRank) {
        if (!leaderboardRankRewards[week]) {
          leaderboardRankRewards[week] = {
            points: 0,
            rank: weeklyRank,
            week: weekNumber,
            type: 'leaderboard_rank'
          };
        }
        leaderboardRankRewards[week].points += points;
      }
    }
  }

  return [
    {
      points: devSeasonTotalPoints,
      type: 'season',
      season: seasonStarts[0]
    } as SeasonPointsReceiptsReward,
    {
      points: preSeasonTotalPoints,
      type: 'season',
      season: seasonStarts[1]
    } as SeasonPointsReceiptsReward,
    ...Object.values(builderRewards),
    ...Object.values(soldNftRewards),
    ...Object.values(leaderboardRankRewards)
  ]
    .filter((reward) => reward.points)
    .sort((a, b) => {
      if (a.type === 'season' && b.type === 'season') {
        return b.season.localeCompare(a.season);
      }
      if (a.type === 'season' || b.type === 'season') {
        return -1;
      }
      if (a.week === b.week) {
        return b.points - a.points;
      }
      return b.week - a.week;
    });
}

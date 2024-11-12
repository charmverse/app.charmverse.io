import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import type { LeaderboardBuilder } from '../builders/getBuildersLeaderboard';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';

import { calculateEarnableScoutPointsForRank } from './calculatePoints';

export async function getPointsCountForWeekWithNormalisation({ week }: { week: string }): Promise<{
  totalPoints: number;
  normalisationFactor: number;
  normalisedBuilders: { builder: LeaderboardBuilder; normalisedPoints: number }[];
}> {
  const leaderboard = await getBuildersLeaderboard({ week, quantity: weeklyRewardableBuilders });

  const weeklyAllocatedPoints = await getCurrentWeekPointsAllocation({ week });

  const pointsQuotas = leaderboard.map((builder, index) => ({
    builder,
    earnablePoints: calculateEarnableScoutPointsForRank({ rank: builder.rank, weeklyAllocatedPoints })
  }));

  const points = pointsQuotas.reduce((acc, val) => acc + val.earnablePoints, 0);

  if (points === 0) {
    throw new Error('Points evaluated to 0');
  }

  const normalisationFactor = weeklyAllocatedPoints / points;

  return {
    totalPoints: points,
    normalisationFactor,
    normalisedBuilders: pointsQuotas.map(({ builder, earnablePoints }) => ({
      builder,
      normalisedPoints: earnablePoints * normalisationFactor
    }))
  };
}

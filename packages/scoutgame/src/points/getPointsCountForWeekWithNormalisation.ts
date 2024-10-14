import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { weeklyAllocatedPoints } from '../dates';
import type { LeaderboardBuilder } from '../getBuildersLeaderboard';
import { getBuildersLeaderboard } from '../getBuildersLeaderboard';

import { calculateEarnableScoutPointsForRank } from './calculatePoints';

export async function getPointsCountForWeekWithNormalisation({ week }: { week: string }): Promise<{
  totalPoints: number;
  normalisationFactor: number;
  normalisedBuilders: { builder: LeaderboardBuilder; normalisedPoints: number }[];
}> {
  const leaderboard = await getBuildersLeaderboard({ week, quantity: weeklyRewardableBuilders });

  const pointsQuotas = leaderboard.map((builder, index) => ({
    builder,
    earnablePoints: calculateEarnableScoutPointsForRank(builder.rank)
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

// getPointsCountForWeekWithNormalisation({ week: '2024-W41' }).then(console.log);

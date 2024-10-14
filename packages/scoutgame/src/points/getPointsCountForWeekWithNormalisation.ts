import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { weeklyAllocatedPoints } from '../dates';
import { getBuildersLeaderboard } from '../getBuildersLeaderboard';

import { calculateEarnableScoutPointsForRank } from './calculatePoints';

export async function getPointsCountForWeekWithNormalisation({ week }: { week: string }): Promise<{
  totalPoints: number;
  normalisationFactor: number;
}> {
  const leaderboard = await getBuildersLeaderboard({ week, quantity: weeklyRewardableBuilders });

  const pointsQuotas = leaderboard.map((builder, index) => calculateEarnableScoutPointsForRank(index + 1));

  const points = pointsQuotas.reduce((acc, val) => acc + val, 0);

  if (points === 0) {
    throw new Error('Points evaluated to 0');
  }

  return { totalPoints: points, normalisationFactor: weeklyAllocatedPoints / points };
}

// getPointsCountForWeekWithNormalisation({ week: '2024-W41' }).then(console.log);

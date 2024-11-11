import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';

import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

export async function getWeeklyPointsPoolAndBuilders({ week }: { week: string }) {
  const topWeeklyBuilders = await getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week });

  const { normalisationFactor, totalPoints } = await getPointsCountForWeekWithNormalisation({ week });

  const weeklyAllocatedPoints = await getCurrentWeekPointsAllocation({ week });

  return {
    topWeeklyBuilders,
    normalisationFactor,
    totalPoints,
    weeklyAllocatedPoints
  };
}

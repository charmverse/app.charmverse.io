import { weeklyAllocatedPoints } from '../dates';

const decayRate = 0.03;

export function customCalculateEarnableScoutPointsForRank({ rank, points }: { rank: number; points: number }) {
  return points * ((1 - decayRate) ** (rank - 1) - (1 - decayRate) ** rank);
}

export function calculateEarnableScoutPointsForRank(rank: number) {
  return customCalculateEarnableScoutPointsForRank({ rank, points: weeklyAllocatedPoints });
}

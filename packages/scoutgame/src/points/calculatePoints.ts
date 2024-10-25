const decayRate = 0.03;

export function calculateEarnableScoutPointsForRank({
  rank,
  weeklyAllocatedPoints
}: {
  rank: number;
  weeklyAllocatedPoints: number;
}) {
  return weeklyAllocatedPoints * ((1 - decayRate) ** (rank - 1) - (1 - decayRate) ** rank);
}

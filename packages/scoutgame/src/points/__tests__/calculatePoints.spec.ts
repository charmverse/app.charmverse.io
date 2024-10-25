import { calculateEarnableScoutPointsForRank } from '../calculatePoints';

describe('calculateEarnableScoutPointsForRank', () => {
  it('should return correct value for rank 1', () => {
    expect(calculateEarnableScoutPointsForRank({ rank: 1, weeklyAllocatedPoints: 100 })).toBeCloseTo(3);
  });

  it('should return correct value for rank 100', () => {
    expect(calculateEarnableScoutPointsForRank({ rank: 100, weeklyAllocatedPoints: 100 })).toBeCloseTo(0.147);
  });
});

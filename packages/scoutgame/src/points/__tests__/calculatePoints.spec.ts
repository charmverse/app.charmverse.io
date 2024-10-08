import { customCalculateEarnableScoutPointsForRank } from '../calculatePoints';

describe('calculateEarnableScoutPointsForRank', () => {
  it('should return correct value for rank 1', () => {
    expect(customCalculateEarnableScoutPointsForRank({ rank: 1, points: 100 })).toBeCloseTo(3);
  });

  it('should return correct value for rank 100', () => {
    expect(customCalculateEarnableScoutPointsForRank({ rank: 100, points: 100 })).toBeCloseTo(0.147);
  });
});

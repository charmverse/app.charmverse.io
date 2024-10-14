import { builderPointsShare, scoutPointsShare, weeklyRewardableBuilders } from '../constants';

describe('builder nft constants', () => {
  it('scoutPointsShare should have a value of 0.8', () => {
    expect(scoutPointsShare).toBe(0.8);
  });

  it('builderPointsShare should have a value of 0.2', () => {
    expect(builderPointsShare).toBe(0.2);
  });

  it('weeklyRewardableBuilders should have a value of 100', () => {
    expect(weeklyRewardableBuilders).toBe(100);
  });
});

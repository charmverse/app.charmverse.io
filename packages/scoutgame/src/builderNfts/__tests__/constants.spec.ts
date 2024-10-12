import { builderPointsShare, scoutPointsShare } from '../constants';

describe('point splits', () => {
  it('scoutPointsShare should have a value of 0.8', () => {
    expect(scoutPointsShare).toBe(0.8);
  });

  it('builderPointsShare should have a value of 0.2', () => {
    expect(builderPointsShare).toBe(0.2);
  });
});

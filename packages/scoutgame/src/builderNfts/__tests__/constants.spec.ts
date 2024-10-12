import { builderPointsShare, scoutPointsShare } from '../constants';

describe('point splits', () => {
  it('should have a value of 0.8 for the scout', () => {
    expect(scoutPointsShare).toBe(0.8);
  });

  it('should have a value of 0.2 for the builder', () => {
    expect(builderPointsShare).toBe(0.2);
  });
});

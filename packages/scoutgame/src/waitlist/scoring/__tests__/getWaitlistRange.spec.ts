import { getWaitlistRange, waitlistTiers } from '../constants';

describe('getWaitlistRange', () => {
  it('should return the correct range for each tier', () => {
    const expectedRanges = {
      common: { min: 1, max: 30 },
      rare: { min: 31, max: 60 },
      epic: { min: 61, max: 80 },
      mythic: { min: 81, max: 95 },
      legendary: { min: 96, max: 100 }
    };

    waitlistTiers.forEach((tier) => {
      const { min, max } = getWaitlistRange(tier);
      expect({ min, max }).toEqual(expectedRanges[tier]);
    });
  });

  it('should throw an error for an invalid tier', () => {
    expect(() => getWaitlistRange('invalid-tier' as any)).toThrow('Invalid tier: invalid-tier');
  });
});

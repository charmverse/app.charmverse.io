import { getTier, tierDistribution } from '../constants';

describe('getTier', () => {
  it('should return "common" if percentile is null or undefined', () => {
    expect(getTier(null)).toBe('common');
    expect(getTier(undefined)).toBe('common');
  });

  it('should return "common" for percentiles less than the threshold for rare (boundary case)', () => {
    expect(getTier(1)).toBe('common'); // Lower bound for "common"
    expect(getTier(29)).toBe('common');
  });

  it('should return "rare" for percentiles in the rare tier', () => {
    expect(getTier(30)).toBe('rare'); // Boundary case for "rare"
    expect(getTier(40)).toBe('rare');
    expect(getTier(59)).toBe('rare'); // Upper bound for "rare"
  });

  it('should return "epic" for percentiles in the epic tier', () => {
    expect(getTier(60)).toBe('epic'); // Boundary case for "epic"
    expect(getTier(70)).toBe('epic');
    expect(getTier(79)).toBe('epic'); // Upper bound for "epic"
  });

  it('should return "mythic" for percentiles in the mythic tier', () => {
    expect(getTier(80)).toBe('mythic'); // Boundary case for "mythic"
    expect(getTier(90)).toBe('mythic');
    expect(getTier(94)).toBe('mythic'); // Upper bound for "mythic"
  });

  it('should return "legendary" for percentiles in the legendary tier', () => {
    expect(getTier(95)).toBe('legendary'); // Boundary case for "legendary"
    expect(getTier(98)).toBe('legendary');
    expect(getTier(100)).toBe('legendary'); // Upper bound for "legendary"
  });

  it('should return the correct tier for boundary percentiles', () => {
    // Check if boundary conditions are correctly handled
    tierDistribution.forEach((tier) => {
      expect(getTier(tier.threshold)).toBe(tier.tier);
    });
  });
});

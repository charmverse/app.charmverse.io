import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { tierDistributionMap } from '@packages/scoutgame/waitlist/scoring/constants';
import { DateTime } from 'luxon';

import { authorizeUserByLaunchDate, launchDates } from '../authorizeUserByLaunchDate';

// Mock the prisma client
jest.mock('@charmverse/core/prisma-client', () => ({
  prisma: {
    scout: {
      count: jest.fn()
    },
    connectWaitlistSlot: {
      findUnique: jest.fn()
    }
  }
}));

describe('authorizeUserByLaunchDate', () => {
  const mockFid = 123;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authorize whitelisted users', async () => {
    (prisma.scout.count as jest.Mock).mockResolvedValue(1);

    const result = await authorizeUserByLaunchDate({ fid: mockFid });
    expect(result).toBe(true);
  });

  it.each(Object.entries(launchDates))(
    'should authorize users for %s tier on the correct date',
    async (launchDate, tier) => {
      (prisma.scout.count as jest.Mock).mockResolvedValue(0);
      (prisma.connectWaitlistSlot.findUnique as jest.Mock).mockResolvedValue({
        fid: mockFid,
        percentile: tierDistributionMap[tier].threshold
      });

      const now = DateTime.fromISO(launchDate, { zone: 'utc' }).plus({ minutes: 1 });
      const result = await authorizeUserByLaunchDate({ fid: mockFid, now });
      expect(result).toBe(true);
    }
  );

  it.each(Object.entries(launchDates))(
    'should not authorize users for %s tier before the launch date',
    async (launchDate, tier) => {
      (prisma.scout.count as jest.Mock).mockResolvedValue(0);
      (prisma.connectWaitlistSlot.findUnique as jest.Mock).mockResolvedValue({
        fid: mockFid,
        percentile: tierDistributionMap[tier].threshold
      });

      const now = DateTime.fromISO(launchDate, { zone: 'utc' }).minus({ days: 1 });
      await expect(authorizeUserByLaunchDate({ fid: mockFid, now })).rejects.toThrow(UnauthorisedActionError);
    }
  );

  it('should not authorize users with percentile above their tier', async () => {
    (prisma.scout.count as jest.Mock).mockResolvedValue(0);
    (prisma.connectWaitlistSlot.findUnique as jest.Mock).mockResolvedValue({
      fid: mockFid,
      percentile: 0 // Above all tiers
    });

    const now = DateTime.fromISO(Object.keys(launchDates)[Object.keys(launchDates).length - 1]).plus({ days: 1 });
    await expect(authorizeUserByLaunchDate({ fid: mockFid, now })).rejects.toThrow(UnauthorisedActionError);
  });

  it('should not authorize users without a waitlist record', async () => {
    (prisma.scout.count as jest.Mock).mockResolvedValue(0);
    (prisma.connectWaitlistSlot.findUnique as jest.Mock).mockResolvedValue(null);

    const now = DateTime.fromISO(Object.keys(launchDates)[Object.keys(launchDates).length - 1]).plus({ days: 1 });
    await expect(authorizeUserByLaunchDate({ fid: mockFid, now })).rejects.toThrow(UnauthorisedActionError);
  });
});

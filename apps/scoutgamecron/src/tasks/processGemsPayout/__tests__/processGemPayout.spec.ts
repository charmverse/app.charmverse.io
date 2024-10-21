import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getLastWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockScout, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';
import { createContext } from '@packages/testing/koa/context';
import { DateTime } from 'luxon';

const { processGemsPayout } = await import('../index');

describe('processGemsPayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run at midnight Monday in UTC', async () => {
    // Mock the current time to be Monday at 00:00:00 UTC
    const mockNow = DateTime.fromObject(
      { year: 2024, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
      { zone: 'utc' }
    );
    const season = '2024-W01';
    const lastWeek = getLastWeek(mockNow);

    // Create a mock builder and NFT
    const builder = await mockBuilder({ createNft: true, nftSeason: season });
    const scout = await mockScout({ builderId: builder.id, season });
    await mockUserWeeklyStats({ season, week: lastWeek, userId: builder.id });

    await processGemsPayout(createContext(), { now: mockNow, season });

    // Check that the process was executed
    const events = await prisma.builderEvent.findMany({
      where: {
        season,
        week: lastWeek,
        type: 'gems_payout'
      }
    });
    expect(events.length).toBe(1);
  });

  it('should not run twice', async () => {
    // Mock the current time to be Monday at 00:00:00 UTC
    const mockNow = DateTime.fromObject(
      { year: 2024, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
      { zone: 'utc' }
    );

    jest.unstable_mockModule('@packages/scoutgame/getBuildersLeaderboard', () => ({
      getBuildersLeaderboard: jest.fn()
    }));
    const { getBuildersLeaderboard } = await import('@packages/scoutgame/getBuildersLeaderboard');
    // mock the prisma count to return 1
    jest.spyOn(prisma.builderEvent, 'count').mockResolvedValue(1);

    await processGemsPayout(createContext(), { now: mockNow });
    expect(getBuildersLeaderboard).toHaveBeenCalledTimes(0);
  });

  it('should not run at other times', async () => {
    jest.unstable_mockModule('@packages/scoutgame/getBuildersLeaderboard', () => ({
      getBuildersLeaderboard: jest.fn()
    }));
    const { getBuildersLeaderboard } = await import('@packages/scoutgame/getBuildersLeaderboard');
    // Mock the current time to be Monday at 04:00:00 UTC (outside the 3-hour window)
    const mockNow = DateTime.fromObject(
      { year: 2024, month: 1, day: 1, hour: 4, minute: 0, second: 0 },
      { zone: 'utc' }
    );

    await processGemsPayout(createContext(), { now: mockNow });

    // Check that the process was not executed
    expect(getBuildersLeaderboard).not.toHaveBeenCalled();
  });
});

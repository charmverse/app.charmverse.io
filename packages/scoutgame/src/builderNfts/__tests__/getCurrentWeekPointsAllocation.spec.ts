import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../../dates';
import { mockBuilder } from '../../testing/database';
import { getCurrentWeekPointsAllocation } from '../getCurrentWeekPointsAllocation';

const pointsPerActiveBuilder = 2500;

describe('getCurrentWeekPointsAllocation', () => {
  const validWeek = '2024-W42';

  beforeAll(async () => {
    // Clear relevant data for a clean test environment.
    await prisma.userWeeklyStats.deleteMany({});
  });

  it('should return correct points allocation when there are approved builders with gems collected for the week', async () => {
    const builder1 = await mockBuilder({ builderStatus: 'approved' });
    const builder2 = await mockBuilder({ builderStatus: 'approved' });
    const builderWithoutPoints = await mockBuilder({ builderStatus: 'approved' });

    const excludedBuilder = await mockBuilder({ builderStatus: 'approved' });

    await prisma.userWeeklyStats.createMany({
      data: [
        { week: validWeek, gemsCollected: 10, userId: builder1.id, season: currentSeason },
        { week: validWeek, gemsCollected: 15, season: currentSeason, userId: builder2.id },
        { week: validWeek, gemsCollected: 0, season: currentSeason, userId: builderWithoutPoints.id },
        { week: '2024-W40', gemsCollected: 0, season: currentSeason, userId: excludedBuilder.id }
      ]
    });

    const points = await getCurrentWeekPointsAllocation({ week: validWeek });

    expect(points).toBe(2 * pointsPerActiveBuilder);
  });

  it('should throw InvalidInputError for invalid week format', async () => {
    const invalidWeek = 2024; // Using a non-string format

    await expect(getCurrentWeekPointsAllocation({ week: invalidWeek as unknown as string })).rejects.toThrow(
      InvalidInputError
    );
  });
});

describe('constants', () => {
  it('pointsPerActiveBuilder should be 2500', () => {
    expect(pointsPerActiveBuilder).toEqual(2500);
  });
});

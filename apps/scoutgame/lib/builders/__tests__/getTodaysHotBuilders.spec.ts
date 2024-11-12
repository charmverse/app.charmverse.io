import { prisma } from '@charmverse/core/prisma-client';
import { getTodaysHotBuilders } from '@packages/scoutgame/builders/getTodaysHotBuilders';
import { getCurrentWeek, getLastWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';

beforeEach(async () => {
  await prisma.userWeeklyStats.deleteMany();
  await prisma.scout.deleteMany();
});

describe('getTodaysHotBuilders', () => {
  it('should filter banned builders and return current and previous week builders', async () => {
    const currentWeekBuilders = await Promise.all([
      mockBuilder(),
      mockBuilder({
        builderStatus: 'banned'
      }),
      mockBuilder()
    ]);
    const previousWeekBuilders = await Promise.all([
      mockBuilder(),
      mockBuilder(),
      mockBuilder({
        builderStatus: 'banned'
      })
    ]);

    await Promise.all(
      currentWeekBuilders.map((builder, index) =>
        mockUserWeeklyStats({
          userId: builder.id,
          week: getCurrentWeek(),
          rank: index + 1,
          gemsCollected: 10
        })
      )
    );

    await Promise.all(
      previousWeekBuilders.map((builder, index) =>
        mockUserWeeklyStats({
          userId: builder.id,
          week: getLastWeek(),
          rank: index + 1,
          gemsCollected: 5
        })
      )
    );

    const result = await getTodaysHotBuilders();
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe(currentWeekBuilders[0].id);
    expect(result[1].id).toBe(currentWeekBuilders[2].id);
    expect(result[2].id).toBe(previousWeekBuilders[0].id);
    expect(result[3].id).toBe(previousWeekBuilders[1].id);
  });

  it('should skip builders with no gems collected in current week', async () => {
    const currentWeekBuilder = await mockBuilder();
    const previousWeekBuilder = await mockBuilder();
    await mockUserWeeklyStats({
      userId: currentWeekBuilder.id,
      week: getCurrentWeek(),
      rank: 1,
      gemsCollected: 0
    });
    await mockUserWeeklyStats({
      userId: previousWeekBuilder.id,
      week: getLastWeek(),
      rank: 1,
      gemsCollected: 5
    });

    const result = await getTodaysHotBuilders();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(previousWeekBuilder.id);
  });
});

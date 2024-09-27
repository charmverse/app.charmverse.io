import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getPreviousWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';
import { mockSeason, mockWeek } from '@packages/scoutgame/testing/generators';

import type { BuildersSort } from '../getSortedBuilders';
import { getSortedBuilders } from '../getSortedBuilders';

describe('getSortedBuilders', () => {
  beforeEach(async () => {
    await prisma.scout.deleteMany();
  });

  const testCases: [BuildersSort, string][] = [
    ['new', 'should sort builders by creation date'],
    ['top', 'should sort builders by gems collected in the current week'],
    ['hot', 'should sort builders by gems collected in the previous week']
  ];

  it('Should sort builders by new', async () => {
    const builders = await Promise.all([
      mockBuilder({ createdAt: new Date('2024-01-01') }),
      mockBuilder({ createdAt: new Date('2024-01-02') }),
      mockBuilder({ createdAt: new Date('2024-01-03') })
    ]);
    const result = await getSortedBuilders({ sort: 'new', limit: 3, week: mockWeek, season: mockSeason });
    expect(result.map((r) => r.id)).toEqual(builders.map((r) => r.id).reverse());
  });

  it('Should sort builders by top', async () => {
    // include a 3rd builder that has no weekly stats for this week
    const builders = await Promise.all([mockBuilder(), mockBuilder(), mockBuilder()]);
    // create weekly stats
    await mockUserWeeklyStats({
      userId: builders[0].id,
      week: mockWeek,
      rank: 1
    });
    await mockUserWeeklyStats({
      userId: builders[1].id,
      week: mockWeek,
      rank: 2
    });
    const result = await getSortedBuilders({ sort: 'top', limit: 3, season: mockSeason, week: mockWeek });
    expect(result.map((r) => r.id)).toEqual([builders[0].id, builders[1].id]);
  });

  it('Should sort builders by hot', async () => {
    const builders = await Promise.all([mockBuilder(), mockBuilder(), mockBuilder()]);
    await mockUserWeeklyStats({
      userId: builders[0].id,
      week: getPreviousWeek(mockWeek),
      rank: 5
    });
    await mockUserWeeklyStats({
      userId: builders[1].id,
      week: getPreviousWeek(mockWeek),
      rank: 2
    });
    const result = await getSortedBuilders({ sort: 'hot', limit: 3, season: mockSeason, week: mockWeek });
    expect(result.map((r) => r.id)).toEqual([builders[1].id, builders[0].id]);
  });

  it('should throw an error for invalid sort option', async () => {
    await expect(
      getSortedBuilders({ sort: 'invalid' as BuildersSort, limit: 10, season: mockSeason, week: mockWeek })
    ).rejects.toThrow('Invalid sort option: invalid');
  });
});

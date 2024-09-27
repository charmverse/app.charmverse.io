import { prisma } from '@charmverse/core/prisma-client';
import { getPreviousWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';
import { mockSeason, mockWeek } from '@packages/scoutgame/testing/generators';
import { v4 } from 'uuid';

import type { BuildersSort } from '../getSortedBuilders';
import { getSortedBuilders } from '../getSortedBuilders';

describe('getSortedBuilders', () => {
  beforeEach(async () => {
    await prisma.scout.deleteMany();
  });

  it('Should sort builders by new', async () => {
    const builders = await Promise.all([
      mockBuilder({ createdAt: new Date('2024-01-01'), createNft: true }),
      mockBuilder({ createdAt: new Date('2024-01-02'), createNft: true }),
      mockBuilder({ createdAt: new Date('2024-01-03'), createNft: true })
    ]);
    const result = await getSortedBuilders({ sort: 'new', limit: 3, week: mockWeek, season: mockSeason });
    expect(result.map((r) => r.id)).toEqual(builders.map((r) => r.id).reverse());
  });

  it('Should sort builders by top', async () => {
    // include a 3rd builder that has no weekly stats for this week
    const builders = await Promise.all([
      mockBuilder({ createNft: true }),
      mockBuilder({ createNft: true }),
      mockBuilder({ createNft: true })
    ]);
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
    const builders = await Promise.all([
      mockBuilder({ createNft: true }),
      mockBuilder({ createNft: true }),
      mockBuilder({ createNft: true })
    ]);
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

  it('should skip builders without nfts', async () => {
    const week = v4();
    const builders = await Promise.all([mockBuilder(), mockBuilder({ createNft: true }), mockBuilder()]);
    await mockUserWeeklyStats({
      userId: builders[1].id,
      week,
      rank: 2
    });

    const result = await getSortedBuilders({ sort: 'new', limit: 3, season: mockSeason, week });
    expect(result.map((r) => r.id)).toEqual([builders[1].id]);
  });

  it('should skip rejected or pending or banned builders', async () => {
    const week = v4();
    const builders = await Promise.all([
      mockBuilder({ builderStatus: 'applied' }),
      mockBuilder({ createNft: true }),
      mockBuilder({ builderStatus: 'banned' }),
      mockBuilder({ builderStatus: 'rejected' })
    ]);
    const result = await getSortedBuilders({ sort: 'new', limit: 3, season: mockSeason, week });
    expect(result.map((r) => r.id)).toEqual([builders[1].id]);
  });

  it('should throw an error for invalid sort option', async () => {
    await expect(
      getSortedBuilders({ sort: 'invalid' as BuildersSort, limit: 10, season: mockSeason, week: mockWeek })
    ).rejects.toThrow('Invalid sort option: invalid');
  });
});

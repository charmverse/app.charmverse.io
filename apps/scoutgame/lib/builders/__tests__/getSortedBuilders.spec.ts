import { getPreviousWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';
import { v4 } from 'uuid';

import type { BuildersSort } from '../getSortedBuilders';
import { getSortedBuilders } from '../getSortedBuilders';

describe('getSortedBuilders', () => {
  it('Should sort builders by new', async () => {
    const mockWeek = '2024-W21';
    const mockSeason = '2024-W21';
    const builders = await Promise.all([
      mockBuilder({ createdAt: new Date('2024-01-01'), createNft: true, nftSeason: mockSeason }),
      mockBuilder({ createdAt: new Date('2024-01-02'), createNft: true, nftSeason: mockSeason }),
      mockBuilder({ createdAt: new Date('2024-01-03'), createNft: true, nftSeason: mockSeason })
    ]);
    const { builders: paginatedBuilders } = await getSortedBuilders({
      sort: 'new',
      limit: 3,
      week: mockWeek,
      season: mockSeason,
      cursor: null
    });
    expect(paginatedBuilders.map((r) => r.id)).toEqual(builders.map((r) => r.id).reverse());
  });

  it('Should sort builders by hot', async () => {
    const mockWeek = '2024-W22';
    const mockSeason = '2024-W22';
    // include a 3rd builder that has no weekly stats for this week
    const builders = await Promise.all([
      mockBuilder({ createNft: true, nftSeason: mockSeason }),
      mockBuilder({ createNft: true, nftSeason: mockSeason }),
      mockBuilder({ createNft: true, nftSeason: mockSeason })
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
    const { builders: paginatedBuilders } = await getSortedBuilders({
      sort: 'hot',
      limit: 3,
      season: mockSeason,
      week: mockWeek,
      cursor: null
    });
    expect(paginatedBuilders.map((r) => r.id)).toEqual([builders[0].id, builders[1].id]);
  });

  it('Should sort builders by top', async () => {
    const mockWeek = '2024-W23';
    const mockSeason = '2024-W23';
    const builders = await Promise.all([
      mockBuilder({ createNft: true, nftSeason: mockSeason }),
      mockBuilder({ createNft: true, nftSeason: mockSeason }),
      mockBuilder({ createNft: true, nftSeason: mockSeason })
    ]);
    await mockUserWeeklyStats({
      userId: builders[0].id,
      week: getPreviousWeek(mockWeek),
      season: mockSeason,
      rank: 5
    });
    await mockUserWeeklyStats({
      userId: builders[1].id,
      week: getPreviousWeek(mockWeek),
      season: mockSeason,
      rank: 2
    });
    // rank should be pulled from the current week
    await mockUserWeeklyStats({
      userId: builders[1].id,
      week: mockWeek,
      season: mockSeason,
      rank: 999
    });
    const { builders: paginatedBuilders } = await getSortedBuilders({
      sort: 'top',
      limit: 3,
      season: mockSeason,
      week: mockWeek,
      cursor: null
    });
    expect(paginatedBuilders.map((r) => r.id)).toEqual([builders[1].id, builders[0].id]);
    expect(paginatedBuilders[0].rank).toEqual(999);
  });

  it('should skip builders without nfts', async () => {
    const mockWeek = '2024-W24';
    const mockSeason = '2024-W24';
    const builders = await Promise.all([
      mockBuilder(),
      mockBuilder({ createNft: true, nftSeason: mockSeason }),
      mockBuilder()
    ]);
    await mockUserWeeklyStats({
      userId: builders[1].id,
      week: mockWeek,
      rank: 2
    });

    const { builders: paginatedBuilders } = await getSortedBuilders({
      sort: 'new',
      limit: 3,
      season: mockSeason,
      week: mockWeek,
      cursor: null
    });
    expect(paginatedBuilders.map((r) => r.id)).toEqual([builders[1].id]);
  });

  it('should skip rejected or pending or banned builders', async () => {
    const mockWeek = '2024-W25';
    const mockSeason = '2024-W25';
    const builders = await Promise.all([
      mockBuilder({ builderStatus: 'applied' }),
      mockBuilder({ createNft: true, nftSeason: mockSeason }),
      mockBuilder({ builderStatus: 'banned' }),
      mockBuilder({ builderStatus: 'rejected' })
    ]);
    const { builders: paginatedBuilders } = await getSortedBuilders({
      sort: 'new',
      limit: 3,
      season: mockSeason,
      week: mockWeek,
      cursor: null
    });
    expect(paginatedBuilders.map((r) => r.id)).toEqual([builders[1].id]);
  });

  it('should throw an error for invalid sort option', async () => {
    const mockWeek = '2024-W26';
    const mockSeason = '2024-W26';
    await expect(
      getSortedBuilders({
        sort: 'invalid' as BuildersSort,
        limit: 10,
        season: mockSeason,
        week: mockWeek,
        cursor: null
      })
    ).rejects.toThrow('Invalid sort option: invalid');
  });
});

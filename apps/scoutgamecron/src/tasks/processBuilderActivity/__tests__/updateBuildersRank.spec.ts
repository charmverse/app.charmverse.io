import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder, mockUserWeeklyStats } from '@packages/scoutgame/testing/database';

import { updateBuildersRank } from '../updateBuildersRank';

const mockWeek = '2021-w21';

describe('updateBuildersRank', () => {
  it('should update the rank of all builders with weekly stats', async () => {
    let n = 3;
    while (n) {
      const builder = await mockBuilder();
      await mockUserWeeklyStats({ week: mockWeek, userId: builder.id, gemsCollected: n });
      n -= 1;
    }

    await updateBuildersRank({ week: mockWeek });
    const weeklyStats = await prisma.userWeeklyStats.findMany({
      where: {
        week: mockWeek
      },
      orderBy: {
        rank: 'asc'
      }
    });
    expect(weeklyStats).toEqual([
      expect.objectContaining({
        rank: 1,
        gemsCollected: 3
      }),
      expect.objectContaining({
        rank: 2,
        gemsCollected: 2
      }),
      expect.objectContaining({
        rank: 3,
        gemsCollected: 1
      })
    ]);
  });
});

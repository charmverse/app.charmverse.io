import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { getTopBuilders } from '../getTopBuilders';
import { mockBuilder } from '../testing/database';

describe('getTopBuilders', () => {
  it('should return top builders sorted by gems collected, handle ties, and respect quantity parameter', async () => {
    const testWeek = v4();
    const previousWeek = v4();
    const builders = await Promise.all(
      Array(10)
        .fill(null)
        .map(() => mockBuilder())
    );

    await Promise.all(
      builders.map(async (builder, index) => {
        await prisma.userWeeklyStats.create({
          data: {
            userId: builder.id,
            week: testWeek,
            gemsCollected: 10 - index
          }
        });

        // Create merged pull request event
        await prisma.builderEvent.create({
          data: {
            type: 'merged_pull_request',
            builderId: builder.id,
            season: 1,
            week: testWeek,
            createdAt: new Date(2023, 4, 15 + index)
          }
        });
      })
    );

    // Add more weekly stats and events to the builders of previous weeks
    await Promise.all(
      builders.map(async (builder) => {
        await prisma.userWeeklyStats.create({
          data: {
            userId: builder.id,
            week: previousWeek,
            gemsCollected: 10
          }
        });

        await prisma.builderEvent.create({
          data: {
            type: 'merged_pull_request',
            builderId: builder.id,
            season: 1,
            week: previousWeek,
            createdAt: new Date(2023, 3, 15)
          }
        });
      })
    );

    // Create a tie scenario for the 3rd and 4th builders
    await prisma.userWeeklyStats.updateMany({
      where: {
        userId: {
          in: [builders[2].id, builders[3].id]
        }
      },
      data: { gemsCollected: 7 }
    });

    const topBuilders = await getTopBuilders({ quantity: 5, week: testWeek });

    expect(topBuilders).toHaveLength(5);

    expect(topBuilders[0].gemsCollected).toBe(10);
    expect(topBuilders[1].gemsCollected).toBe(9);
    expect(topBuilders[2].gemsCollected).toBe(7);
    expect(topBuilders[3].gemsCollected).toBe(7);
    expect(topBuilders[4].gemsCollected).toBe(6);

    expect(topBuilders[2].builder.id).toBe(builders[2].id);
    expect(topBuilders[3].builder.id).toBe(builders[3].id);

    topBuilders.forEach((item, index) => {
      expect(item.rank).toBe(index + 1);
    });
  });
});

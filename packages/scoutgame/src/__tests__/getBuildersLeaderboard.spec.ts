import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { getBuildersLeaderboard } from '../getBuildersLeaderboard';
import { mockBuilder } from '../testing/database';

describe('getBuildersLeaderboard', () => {
  it('should return top builders sorted by gems collected, handle ties, and respect quantity parameter', async () => {
    const testWeek = v4();
    const previousWeek = v4();
    const builders = await Promise.all(
      Array(10)
        .fill(null)
        .map(() => mockBuilder({ username: `user-${v4()}` }))
    );

    await Promise.all(
      builders.map(async (builder, index) => {
        await prisma.userWeeklyStats.create({
          data: {
            userId: builder.id,
            week: testWeek,
            gemsCollected: 10 - index,
            season: 'blah'
          }
        });

        // Create merged pull request event
        await prisma.builderEvent.create({
          data: {
            type: 'merged_pull_request',
            builderId: builder.id,
            season: 'blah',
            week: testWeek,
            createdAt: new Date(2023, 4, 15 + index)
          }
        });
      })
    );

    // Add more weekly stats and events to the builders of previous weeks
    await Promise.all(
      builders.map(async (builder, index) => {
        await prisma.userWeeklyStats.create({
          data: {
            userId: builder.id,
            week: previousWeek,
            season: 'blah',
            gemsCollected: 10
          }
        });

        await prisma.builderEvent.create({
          data: {
            type: 'merged_pull_request',
            builderId: builder.id,
            season: 'blah',
            week: previousWeek,
            createdAt: new Date(2023, 3, 15 + index)
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

    const topBuilders = await getBuildersLeaderboard({ quantity: 5, week: testWeek });

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

  it('should sort builders by username when gems collected and events are the same', async () => {
    const testWeek = v4();
    const builders = await Promise.all([
      mockBuilder({ username: `charlie-${v4()}` }),
      mockBuilder({ username: `alice-${v4()}` }),
      mockBuilder({ username: `bob-${v4()}` }),
      mockBuilder({ username: `david-${v4()}` }),
      mockBuilder({ username: `eve-${v4()}` })
    ]);

    const sortedBuilders = builders.sort((a, b) => a.username.localeCompare(b.username));

    // Create weekly stats with 0 gems collected for all builders
    await Promise.all(
      builders.map(async (builder) => {
        await prisma.userWeeklyStats.create({
          data: {
            userId: builder.id,
            week: testWeek,
            season: 'blah',
            gemsCollected: 0
          }
        });
      })
    );

    const topBuilders = await getBuildersLeaderboard({ quantity: 5, week: testWeek });

    expect(topBuilders).toHaveLength(5);

    // Check if builders are sorted by username in ascending order
    sortedBuilders.forEach((builder, index) => {
      expect(topBuilders[index].builder.username).toBe(builder.username);
    });

    // Verify that all builders have 0 gems collected
    topBuilders.forEach((builder) => {
      expect(builder.gemsCollected).toBe(0);
    });

    // Verify that ranks are assigned correctly
    topBuilders.forEach((item, index) => {
      expect(item.rank).toBe(index + 1);
    });
  });

  it('should only include builders with approved status', async () => {
    const testWeek = v4();
    const builders = await Promise.all([
      mockBuilder({ username: `charlie-${v4()}`, builderStatus: 'approved' }),
      mockBuilder({ username: `alice-${v4()}`, builderStatus: 'applied' }),
      mockBuilder({ username: `bob-${v4()}`, builderStatus: 'rejected' }),
      mockBuilder({ username: `david-${v4()}`, builderStatus: 'approved' }),
      mockBuilder({ username: `eve-${v4()}`, builderStatus: 'approved' })
    ]);

    // Create weekly stats with 0 gems collected for all builders
    await Promise.all(
      builders.map(async (builder) => {
        await prisma.userWeeklyStats.create({
          data: {
            userId: builder.id,
            week: testWeek,
            season: 'blah',
            gemsCollected: 0
          }
        });
      })
    );

    const topBuilders = await getBuildersLeaderboard({ quantity: 5, week: testWeek });

    expect(topBuilders).toHaveLength(3);
  });
});

import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../../dates';
import { mockBuilder } from '../../testing/database';
import { sendPoints } from '../sendPoints';

describe('sendPoints', () => {
  it('should send points quietly', async () => {
    const builder = await mockBuilder();
    const mockPoints = 100;
    await sendPoints({
      builderId: builder.id,
      points: mockPoints,
      hideFromNotifications: true,
      claimed: true,
      description: `Test points`,
      season: currentSeason
    });
    const updated = await prisma.scout.findUnique({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true,
        userSeasonStats: true,
        activities: true
      }
    });
    expect(updated?.currentBalance).toBe(mockPoints);

    // Points should not be added to allTimeStats or userSeasonStats

    expect(updated?.activities[0]).toBeUndefined();
  });

  it('should send points earned as builder', async () => {
    const builder = await mockBuilder();
    const mockPoints = 100;
    await sendPoints({
      builderId: builder.id,
      points: mockPoints,
      description: 'Test description',
      claimed: true
    });
    const updated = await prisma.scout.findUnique({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true,
        userSeasonStats: true,
        activities: true,
        events: true
      }
    });
    expect(updated?.currentBalance).toBe(mockPoints);
    expect(updated?.userSeasonStats[0].pointsEarnedAsBuilder).toBe(mockPoints);
    expect(updated?.activities[0].type).toBe('points');
    expect(updated?.events[0].description).toBe('Test description');
  });
});

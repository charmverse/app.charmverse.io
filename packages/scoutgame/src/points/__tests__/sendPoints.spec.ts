import { prisma } from '@charmverse/core/prisma-client';

import { mockBuilder } from '../../testing/database';
import { sendPoints } from '../sendPoints';

describe('sendPoints', () => {
  it('should send points quietly', async () => {
    const builder = await mockBuilder();
    const mockPoints = 100;
    await sendPoints({
      builderId: builder.id,
      points: mockPoints,
      hideFromNotifications: true
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
    expect(updated?.userSeasonStats[0]).toBeUndefined();
    expect(updated?.activities[0]).toBeUndefined();
  });

  it('should send points earned as builder', async () => {
    const builder = await mockBuilder();
    const mockPoints = 100;
    await sendPoints({
      builderId: builder.id,
      points: mockPoints,
      earnedAsBuilder: true
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
    expect(updated?.userSeasonStats[0].pointsEarnedAsBuilder).toBe(mockPoints);
    expect(updated?.activities[0].type).toBe('points');
  });
});

import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/calculatePoints';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '@packages/scoutgame/testing/database';
import { mockSeason } from '@packages/scoutgame/testing/generators';

import { processScoutPointsPayout } from '../processScoutPointsPayout';

describe('processScoutPointsPayout', () => {
  it('should not create gems payout event, points receipt and builder event for a builder with no NFT purchases', async () => {
    const builder = await mockBuilder();
    const scout1 = await mockScout();
    const scout2 = await mockScout();
    const rank = 1;
    const gemsCollected = 10;
    const week = getCurrentWeek();

    await mockBuilderNft({ builderId: builder.id, season: mockSeason });
    await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week, season: mockSeason });

    const gemsPayoutEvent = await prisma.gemsPayoutEvent.findFirst({
      where: {
        builderId: builder.id,
        week
      }
    });

    expect(gemsPayoutEvent).toBeNull();

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id,
        type: 'gems_payout',
        week
      }
    });

    expect(builderEvent).toBeNull();

    const pointsReceipt = await prisma.pointsReceipt.findFirst({
      where: {
        recipientId: builder.id
      }
    });

    expect(pointsReceipt).toBeNull();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(0);

    const scout1Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout1.id,
        type: 'points',
        recipientType: 'scout'
      }
    });
    expect(scout1Activities).toBe(0);

    const scout2Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout2.id,
        type: 'points',
        recipientType: 'scout'
      }
    });
    expect(scout2Activities).toBe(0);
  });

  it('should distribute points correctly among NFT holders and builder', async () => {
    const builder = await mockBuilder();
    const rank = 1;
    const gemsCollected = 10;
    const week = getCurrentWeek();

    await mockBuilderNft({ builderId: builder.id, season: mockSeason });

    const scout1 = await mockScout();
    const scout2 = await mockScout();

    // Scout 1 has 2 NFTs, scout 2 has 1 NFT
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0 });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0 });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout2.id, points: 0 });

    const totalPoints = calculateEarnableScoutPointsForRank(rank);

    await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week, season: mockSeason });

    const builderPointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: builder.id
      }
    });
    expect(builderPointReceipt.value).toBeCloseTo(Math.floor(0.2 * totalPoints));

    const scout1PointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: scout1.id
      }
    });

    expect(scout1PointReceipt.value).toBeCloseTo(Math.floor(0.8 * totalPoints * (2 / 3)));

    const scout2PointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: scout2.id
      }
    });

    expect(scout2PointReceipt.value).toBeCloseTo(Math.floor(0.8 * totalPoints * (1 / 3)));

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder',
        pointsReceiptId: builderPointReceipt.id
      }
    });
    expect(builderPointReceipt.value).toBeCloseTo(Math.floor(0.2 * totalPoints));

    expect(builderActivities).toBe(1);

    const scout1Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout1.id,
        type: 'points',
        recipientType: 'scout',
        pointsReceiptId: scout1PointReceipt.id
      }
    });

    expect(scout1Activities).toBe(1);

    const scout2Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout2.id,
        type: 'points',
        recipientType: 'scout',
        pointsReceiptId: scout2PointReceipt.id
      }
    });

    expect(scout2Activities).toBe(1);
  });

  it('should not create gems payout, builder event and points receipt if gems payout event already exists', async () => {
    const builder = await mockBuilder();
    const rank = 1;
    const gemsCollected = 10;
    const week = '2023-W01';

    const scout1 = await mockScout();
    const scout2 = await mockScout();

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0 });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout2.id, points: 0 });

    await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week, season: mockSeason });
    await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week, season: mockSeason });
    await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week, season: mockSeason });

    const gemsPayoutEventCount = await prisma.gemsPayoutEvent.count({
      where: {
        builderId: builder.id,
        week
      }
    });

    expect(gemsPayoutEventCount).toBe(1);

    const builderEventCount = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        type: 'gems_payout',
        week
      }
    });

    expect(builderEventCount).toBe(1);

    const builderPointsReceiptCount = await prisma.pointsReceipt.count({
      where: {
        recipientId: builder.id
      }
    });

    expect(builderPointsReceiptCount).toBe(1);

    const scout1PointsReceiptCount = await prisma.pointsReceipt.count({
      where: {
        recipientId: scout1.id
      }
    });

    expect(scout1PointsReceiptCount).toBe(1);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder'
      }
    });

    expect(builderActivities).toBe(1);

    const scout1Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout1.id,
        type: 'points',
        recipientType: 'scout'
      }
    });

    expect(scout1Activities).toBe(1);

    const scout2Activities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout2.id,
        type: 'points',
        recipientType: 'scout'
      }
    });

    expect(scout2Activities).toBe(1);
  });
});

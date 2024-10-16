import { prisma } from '@charmverse/core/prisma-client';
import { builderPointsShare, scoutPointsShare } from '@packages/scoutgame/builderNfts/constants';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
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

  it('should distribute points correctly among NFT holders and builder, respecting scout builder splits, and proportionally to NFTs owned', async () => {
    const builder = await mockBuilder();
    const rank = 1;
    const gemsCollected = 10;
    const week = getCurrentWeek();

    await mockBuilderNft({ builderId: builder.id, season: mockSeason });

    const scout1 = await mockScout();
    const scout2 = await mockScout();

    // Scout 1 has 3 NFTs, scout 2 has 7 NFTs
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0, tokensPurchased: 2 });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout1.id, points: 0 });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout2.id, points: 0 });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout2.id, points: 0, tokensPurchased: 6 });

    const totalPoints = calculateEarnableScoutPointsForRank(rank);

    await prisma.pointsReceipt.deleteMany({
      where: {
        recipientId: {
          in: [builder.id, scout1.id, scout2.id]
        }
      }
    });
    await processScoutPointsPayout({
      builderId: builder.id,
      rank,
      gemsCollected,
      week,
      season: mockSeason
    });
    const builderPointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: builder.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    expect(Math.floor(builderPointReceipt.value)).toEqual(Math.floor(builderPointsShare * totalPoints));

    const builderStats = await getStats({ userId: builder.id });
    expect(builderStats.season?.pointsEarnedAsBuilder).toBe(builderPointReceipt.value);
    expect(builderStats.allTime?.pointsEarnedAsBuilder).toBe(builderPointReceipt.value);

    const scout1PointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: scout1.id
      }
    });

    expect(Math.floor(scout1PointReceipt.value)).toEqual(Math.floor(scoutPointsShare * totalPoints * (3 / 10)));

    const scout1Stats = await getStats({ userId: scout1.id });
    expect(scout1Stats.season?.pointsEarnedAsScout).toBe(scout1PointReceipt.value);
    expect(scout1Stats.allTime?.pointsEarnedAsScout).toBe(scout1PointReceipt.value);

    const scout2PointReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: scout2.id
      }
    });

    expect(Math.floor(scout2PointReceipt.value)).toEqual(Math.floor(scoutPointsShare * totalPoints * (7 / 10)));

    const scout2Stats = await getStats({ userId: scout2.id });
    expect(scout2Stats.season?.pointsEarnedAsScout).toBe(scout2PointReceipt.value);
    expect(scout2Stats.allTime?.pointsEarnedAsScout).toBe(scout2PointReceipt.value);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'points',
        recipientType: 'builder',
        pointsReceiptId: builderPointReceipt.id
      }
    });
    expect(Math.floor(builderPointReceipt.value)).toEqual(Math.floor(builderPointsShare * totalPoints));

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

    await mockBuilderNft({ builderId: builder.id, season: mockSeason });

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
        recipientId: builder.id,
        event: {
          type: 'gems_payout'
        }
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

async function getStats({ userId }: { userId: string }) {
  const userSeasonStats = await prisma.userSeasonStats.findFirstOrThrow({
    where: {
      userId,
      season: mockSeason
    }
  });
  const allTimeStats = await prisma.userAllTimeStats.findFirst({
    where: {
      userId
    }
  });

  return { season: userSeasonStats, allTime: allTimeStats };
}

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek, getPreviousSeason } from '@packages/scoutgame/dates';
import {
  mockBuilder,
  mockScout,
  mockGemPayoutEvent,
  mockBuilderEvent,
  mockUserWeeklyStats,
  mockNFTPurchaseEvent
} from '@packages/scoutgame/testing/database';
import { v4 as uuid } from 'uuid';

import { getClaimablePointsWithEvents } from '../getClaimablePointsWithEvents'; // Update with correct path

describe('getClaimablePointsWithEvents', () => {
  let userId: string;
  let scoutId: string;

  beforeAll(async () => {
    // Setup some users for the test
    const builder = await mockBuilder({ username: uuid() });
    const scout = await mockScout({ username: uuid() });

    userId = builder.id;
    scoutId = scout.id;
  });

  beforeEach(async () => {
    // Clear relevant tables before each test
    await prisma.pointsReceipt.deleteMany();
    await prisma.gemsReceipt.deleteMany();
    await prisma.userWeeklyStats.deleteMany();
  });

  afterAll(async () => {
    // Cleanup and disconnect Prisma
    await prisma.$disconnect();
  });

  it('should return correct totalClaimablePoints and empty rewards when no pointsReceipts found', async () => {
    const result = await getClaimablePointsWithEvents(userId);

    expect(result).toEqual({
      totalClaimablePoints: 0,
      weeklyRewards: [],
      bonusPartners: []
    });
  });

  it('should calculate totalClaimablePoints correctly from pointsReceipts', async () => {
    const previousSeason = getPreviousSeason(currentSeason);

    // Insert mock pointsReceipt data for testing
    await mockGemPayoutEvent({
      builderId: userId,
      recipientId: scoutId,
      amount: 100
    });
    await mockGemPayoutEvent({
      builderId: userId,
      recipientId: scoutId,
      amount: 50
    });

    const result = await getClaimablePointsWithEvents(userId);

    expect(result.totalClaimablePoints).toBe(150);
    expect(result.weeklyRewards.length).toBeGreaterThan(0); // Should have some rewards
  });

  it('should map bonus partners from gemsReceipts correctly', async () => {
    const week = getCurrentWeek();

    // Insert mock pointsReceipt
    await mockGemPayoutEvent({
      builderId: userId,
      recipientId: scoutId,
      amount: 50
    });

    const result = await getClaimablePointsWithEvents(userId);

    expect(result.bonusPartners).toEqual([]); // No bonus partners present in the mock
  });

  it('should include githubContributionReward and soldNftReward in weeklyRewards', async () => {
    // Insert mock data for nft_purchase and gems_payout events
    await mockNFTPurchaseEvent({
      builderId: userId,
      scoutId,
      points: 100
    });

    await mockGemPayoutEvent({
      builderId: userId,
      recipientId: scoutId,
      amount: 200
    });

    const result = await getClaimablePointsWithEvents(userId);

    const weeklyReward = result.weeklyRewards.find((reward) => reward.week === getCurrentWeek());

    expect(weeklyReward?.soldNftReward?.points).toBe(100);
    expect(weeklyReward?.githubContributionReward?.points).toBe(200);
  });

  it('should calculate weekly rank based on userWeeklyStats', async () => {
    const week = getCurrentWeek();

    // Insert mock data for user weekly stats
    await mockUserWeeklyStats({
      userId,
      gemsCollected: 50,
      rank: 1
    });

    const result = await getClaimablePointsWithEvents(userId);

    const weeklyReward = result.weeklyRewards.find((reward) => reward.week === week);

    expect(weeklyReward?.rank).toBe(1);
  });
});

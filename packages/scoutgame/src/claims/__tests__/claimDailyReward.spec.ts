import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { mockBuilder } from '@packages/scoutgame/testing/database';

import { claimDailyReward } from '../claimDailyReward';

describe('claimDailyReward', () => {
  it('should throw error if bonus reward is claimed on a non-last day of the week', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    const isBonus = true;
    await expect(claimDailyReward({ userId, isBonus, dayOfWeek: 1 })).rejects.toThrow();
  });

  it('should throw error if daily reward is claimed twice in a day', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    await claimDailyReward({ userId, isBonus: false, dayOfWeek: 1 });
    await expect(claimDailyReward({ userId, isBonus: false, dayOfWeek: 1 })).rejects.toThrow();
  });

  it('should claim regular daily reward', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;

    await claimDailyReward({ userId, isBonus: false, dayOfWeek: 1 });

    const dailyClaimEvent = await prisma.scoutDailyClaimEvent.findFirstOrThrow({
      where: {
        userId,
        dayOfWeek: 1
      }
    });
    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: userId,
        event: {
          dailyClaimEventId: dailyClaimEvent.id,
          type: 'daily_claim'
        }
      }
    });
    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        currentBalance: true,
        userSeasonStats: {
          select: {
            pointsEarnedAsBuilder: true
          }
        },
        userAllTimeStats: {
          select: {
            pointsEarnedAsBuilder: true
          }
        }
      }
    });

    expect(dailyClaimEvent).toBeDefined();
    expect(pointsReceipt).toBeDefined();
    expect(pointsReceipt.value).toBe(1);
    expect(scout.currentBalance).toBe(1);
    expect(scout.userSeasonStats[0].pointsEarnedAsBuilder).toBe(1);
    expect(scout.userAllTimeStats[0].pointsEarnedAsBuilder).toBe(1);
  });
});

describe('claimDailyReward streak', () => {
  it('should claim daily reward streak', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    const week = getCurrentWeek();

    for (const dayOfWeek of [1, 2, 3, 4, 5, 6, 7]) {
      await claimDailyReward({ userId, week, dayOfWeek });
    }

    // claim streak
    await claimDailyReward({ userId, isBonus: true, week, dayOfWeek: 7 });

    const dailyClaimStreakEvent = await prisma.scoutDailyClaimStreakEvent.findFirstOrThrow({
      where: {
        userId,
        week
      }
    });

    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: userId,
        event: {
          dailyClaimStreakEventId: dailyClaimStreakEvent.id,
          type: 'daily_claim_streak'
        }
      }
    });

    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        currentBalance: true,
        userSeasonStats: {
          select: {
            pointsEarnedAsBuilder: true
          }
        },
        userAllTimeStats: {
          select: {
            pointsEarnedAsBuilder: true
          }
        }
      }
    });

    expect(dailyClaimStreakEvent).toBeDefined();
    expect(pointsReceipt).toBeDefined();
    expect(pointsReceipt.value).toBe(3);
    expect(scout.currentBalance).toBe(10);
    expect(scout.userSeasonStats[0].pointsEarnedAsBuilder).toBe(scout.currentBalance);
    expect(scout.userAllTimeStats[0].pointsEarnedAsBuilder).toBe(scout.currentBalance);
  });

  it('should not allow claiming daily reward streak if not all days are claimed', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;

    await expect(claimDailyReward({ userId, isBonus: true, dayOfWeek: 7 })).rejects.toThrow();
  });
});

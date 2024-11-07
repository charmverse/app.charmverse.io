import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder } from '@packages/scoutgame/testing/database';
import { DateTime } from 'luxon';

import { claimDailyReward } from '../claimDailyReward';

describe('claimDailyReward', () => {
  it('should throw error if bonus reward is claimed on a non-last day of the week', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    const isBonus = true;
    await expect(claimDailyReward({ userId, isBonus })).rejects.toThrow();
  });

  it('should throw error if daily reward is claimed twice in a day', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    await claimDailyReward({ userId, isBonus: false });
    await expect(claimDailyReward({ userId, isBonus: false })).rejects.toThrow();
  });

  it('should claim regular daily reward', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    await claimDailyReward({ userId, isBonus: false });
    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: userId,
        event: {
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
    expect(pointsReceipt).toBeDefined();
    expect(pointsReceipt.value).toBe(1);
    expect(scout.currentBalance).toBe(1);
    expect(scout.userSeasonStats[0].pointsEarnedAsBuilder).toBe(1);
    expect(scout.userAllTimeStats[0].pointsEarnedAsBuilder).toBe(1);
  });

  it('should claim daily reward streak', async () => {
    const builder = await mockBuilder();
    const userId = builder.id;
    const currentDate = DateTime.utc().startOf('day');
    // Move to the next monday
    const weekEndDate = currentDate.plus({ days: 7 - (currentDate.weekday - 1) }).startOf('day');

    await claimDailyReward({ userId, isBonus: true, currentDate: weekEndDate });
    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: userId,
        event: {
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
    expect(pointsReceipt).toBeDefined();
    expect(pointsReceipt.value).toBe(3);
    expect(scout.currentBalance).toBe(3);
    expect(scout.userSeasonStats[0].pointsEarnedAsBuilder).toBe(3);
    expect(scout.userAllTimeStats[0].pointsEarnedAsBuilder).toBe(3);
  });
});

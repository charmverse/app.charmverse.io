import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { sendPointsForDailyClaim } from '@packages/scoutgame/points/builderEvents/sendPointsForDailyClaim';
import { sendPointsForDailyClaimStreak } from '@packages/scoutgame/points/builderEvents/sendPointsForDailyClaimStreak';

export async function claimDailyReward({
  userId,
  isBonus,
  dayOfWeek,
  week = getCurrentWeek()
}: {
  userId: string;
  isBonus?: boolean;
  dayOfWeek: number;
  week?: number;
}) {
  if (dayOfWeek !== 7 && isBonus) {
    throw new Error('Bonus reward can only be claimed on the last day of the week');
  }

  if (isBonus) {
    const existingEvent = await prisma.scoutDailyClaimStreakEvent.findFirst({
      where: {
        userId,
        week
      }
    });

    if (existingEvent) {
      throw new Error('Daily reward streak already claimed');
    }

    const existingEvents = await prisma.scoutDailyClaimEvent.findMany({
      where: {
        userId,
        week
      }
    });

    if (existingEvents.length < 7) {
      throw new Error('You must claim all 7 days of the week to get the bonus reward');
    }

    await sendPointsForDailyClaimStreak({
      builderId: userId,
      points: 3
    });
  } else {
    const existingEvent = await prisma.scoutDailyClaimEvent.findFirst({
      where: {
        userId,
        week,
        dayOfWeek
      }
    });

    if (existingEvent) {
      throw new Error('Daily reward already claimed');
    }

    await sendPointsForDailyClaim({
      builderId: userId,
      points: 1,
      dayOfWeek
    });
  }
}

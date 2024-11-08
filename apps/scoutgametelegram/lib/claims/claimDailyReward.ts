import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { sendPointsForDailyClaim } from '@packages/scoutgame/points/builderEvents/sendPointsForDailyClaim';
import { sendPointsForDailyClaimStreak } from '@packages/scoutgame/points/builderEvents/sendPointsForDailyClaimStreak';
import { DateTime } from 'luxon';

export async function claimDailyReward({
  userId,
  isBonus,
  dayOfWeek
}: {
  userId: string;
  isBonus?: boolean;
  dayOfWeek: number;
}) {
  if (dayOfWeek !== 6 && isBonus) {
    throw new Error('Bonus reward can only be claimed on the last day of the week');
  }

  if (isBonus) {
    const existingEvent = await prisma.scoutDailyClaimStreakEvent.findFirst({
      where: {
        userId,
        week: getCurrentWeek()
      }
    });

    if (existingEvent) {
      throw new Error('Daily reward streak already claimed');
    }

    await sendPointsForDailyClaimStreak({
      builderId: userId,
      points: 3
    });
  } else {
    const existingEvent = await prisma.scoutDailyClaimEvent.findFirst({
      where: {
        userId,
        week: getCurrentWeek(),
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

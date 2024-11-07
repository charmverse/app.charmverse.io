import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek, getDateFromISOWeek, getWeekStartEnd, isToday } from '@packages/scoutgame/dates';
import { incrementPointsEarnedStats } from '@packages/scoutgame/points/updatePointsEarned';
import { DateTime } from 'luxon';

export async function claimDailyReward({ userId, isBonus }: { userId: string; isBonus?: boolean }) {
  const currentWeek = getCurrentWeek();
  const weekDate = getDateFromISOWeek(currentWeek);
  const { end } = getWeekStartEnd(weekDate.toJSDate());
  const isWeekEndDate = isToday(end.toJSDate());

  if (!isWeekEndDate && isBonus) {
    throw new Error('Bonus reward can only be claimed on the last day of the week');
  }

  const existingDailyClaim = await prisma.pointsReceipt.findFirst({
    where: {
      recipientId: userId,
      event: {
        type: 'daily_claim',
        week: getCurrentWeek()
      },
      createdAt: {
        gte: DateTime.now().startOf('day').toJSDate(),
        lte: DateTime.now().endOf('day').toJSDate()
      }
    },
    select: undefined
  });

  if (existingDailyClaim) {
    throw new Error('Daily reward already claimed today');
  }

  await prisma.$transaction(async (tx) => {
    await tx.pointsReceipt.create({
      data: {
        recipient: {
          connect: {
            id: userId
          }
        },
        claimedAt: new Date(),
        value: isBonus ? 3 : 1,
        event: {
          create: {
            type: 'daily_claim',
            week: getCurrentWeek(),
            season: currentSeason,
            builder: {
              connect: {
                id: userId
              }
            }
          }
        }
      }
    });

    await incrementPointsEarnedStats({
      userId,
      season: currentSeason,
      builderPoints: isBonus ? 3 : 1,
      tx
    });
  });
}

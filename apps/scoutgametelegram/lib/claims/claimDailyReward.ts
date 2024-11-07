import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getDateFromISOWeek, getWeekStartEnd, isToday } from '@packages/scoutgame/dates';
import { sendPoints } from '@packages/scoutgame/points/sendPoints';
import { DateTime } from 'luxon';

export async function claimDailyReward({
  userId,
  isBonus,
  currentDate = DateTime.utc()
}: {
  userId: string;
  isBonus?: boolean;
  currentDate?: DateTime;
}) {
  const currentWeek = getCurrentWeek();
  const weekDate = getDateFromISOWeek(currentWeek);
  const { end } = getWeekStartEnd(weekDate.toJSDate());
  const isWeekEndDate = isToday(end.toJSDate(), currentDate);

  if (!isWeekEndDate && isBonus) {
    throw new Error('Bonus reward can only be claimed on the last day of the week');
  }

  const eventType = isBonus ? 'daily_claim_streak' : 'daily_claim';
  const eventPoints = isBonus ? 3 : 1;

  const existingDailyClaim = await prisma.pointsReceipt.findFirst({
    where: {
      recipientId: userId,
      event: {
        type: eventType,
        week: getCurrentWeek()
      },
      createdAt: {
        gte: DateTime.utc().startOf('day').toJSDate(),
        lte: DateTime.utc().endOf('day').toJSDate()
      }
    },
    select: undefined
  });

  if (existingDailyClaim) {
    throw new Error('Daily reward already claimed today');
  }

  await sendPoints({
    builderId: userId,
    eventType,
    points: eventPoints,
    claimed: true,
    earnedAs: 'builder',
    currentDate: currentDate.toJSDate()
  });
}

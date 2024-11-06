import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getDateFromISOWeek, getWeekStartEnd, isToday } from '@packages/scoutgame/dates';
import type { DateTime } from 'luxon';

export type DailyClaim = {
  date: DateTime;
  day: number;
  claimed: boolean;
};

export async function getDailyClaims(userId: string): Promise<DailyClaim[]> {
  const currentWeek = getCurrentWeek();
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      event: {
        builderId: userId,
        type: 'daily_claim',
        week: currentWeek
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true,
      value: true
    }
  });

  const weekDate = getDateFromISOWeek(currentWeek);
  const { start } = getWeekStartEnd(weekDate.toJSDate());
  return new Array(7).fill(null).map((_, index) => {
    const date = start.plus({ days: index });
    const receipt = pointsReceipts.find((_receipt) => isToday(_receipt.createdAt, date));
    return {
      date,
      day: index + 1,
      claimed: !!receipt
    };
  });
}

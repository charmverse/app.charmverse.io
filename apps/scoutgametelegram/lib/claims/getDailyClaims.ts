import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getDateFromISOWeek, getWeekStartEnd, isToday } from '@packages/scoutgame/dates';

export type DailyClaim = {
  date: Date;
  day: number;
  claimed: boolean;
  isBonus?: boolean;
};

export async function getDailyClaims(userId: string): Promise<DailyClaim[]> {
  const currentWeek = getCurrentWeek();
  const builderEvents = await prisma.builderEvent.findMany({
    where: {
      builderId: userId,
      type: {
        in: ['daily_claim', 'daily_claim_streak']
      },
      week: currentWeek
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true,
      type: true
    }
  });

  const weekDate = getDateFromISOWeek(currentWeek);
  const { start } = getWeekStartEnd(weekDate.toJSDate());
  return new Array(7)
    .fill(null)
    .map((_, index) => {
      const date = start.plus({ days: index });
      const builderEvent = builderEvents.find(
        (_builderEvent) => isToday(_builderEvent.createdAt, date) && _builderEvent.type === 'daily_claim'
      );
      const dailyClaimInfo = {
        date: date.toJSDate(),
        day: index + 1,
        claimed: !!builderEvent,
        isBonus: false
      };

      // For the last day of the week, return 2 claims: one for the daily claim and one for the bonus claim
      if (index === 6) {
        const bonusBuilderEvent = builderEvents.find(
          (_builderEvent) => isToday(_builderEvent.createdAt, date) && _builderEvent.type === 'daily_claim_streak'
        );
        return [dailyClaimInfo, { ...dailyClaimInfo, claimed: !!bonusBuilderEvent, isBonus: true }];
      }

      return [dailyClaimInfo];
    })
    .flat();
}

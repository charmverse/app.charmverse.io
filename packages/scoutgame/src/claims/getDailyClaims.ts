import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentWeek } from '../dates';

export type DailyClaim = {
  day: number;
  claimed: boolean;
  isBonus?: boolean;
};

export async function getDailyClaims(userId: string): Promise<DailyClaim[]> {
  const currentWeek = getCurrentWeek();
  const dailyClaimEvents = await prisma.scoutDailyClaimEvent.findMany({
    where: {
      userId,
      week: currentWeek
    },
    orderBy: {
      dayOfWeek: 'asc'
    }
  });

  const dailyClaimStreakEvent = await prisma.scoutDailyClaimStreakEvent.findFirst({
    where: {
      userId,
      week: currentWeek
    }
  });

  return new Array(7)
    .fill(null)
    .map((_, index) => {
      const dailyClaimEvent = dailyClaimEvents.find((_dailyClaimEvent) => _dailyClaimEvent.dayOfWeek === index + 1);

      const dailyClaimInfo = {
        day: index + 1,
        claimed: !!dailyClaimEvent,
        isBonus: false
      };

      // For the last day of the week, return 2 claims: one for the daily claim and one for the bonus claim
      if (index === 6 && dailyClaimEvents.length === 7) {
        return [dailyClaimInfo, { ...dailyClaimInfo, claimed: !!dailyClaimStreakEvent, isBonus: true }];
      }

      return [dailyClaimInfo];
    })
    .flat();
}

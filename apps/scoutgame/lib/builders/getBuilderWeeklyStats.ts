import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/scoutgame/utils';

export async function getBuilderWeeklyStats(builderId: string) {
  const builderWeeklyStats = await prisma.userWeeklyStats.findFirst({
    where: {
      userId: builderId,
      week: getCurrentWeek()
    }
  });

  // TODO: Calculate actual rank
  return {
    rank: 1,
    gemsCollected: builderWeeklyStats?.gemsCollected
  };
}

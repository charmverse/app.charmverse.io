import { prisma } from '@charmverse/core/prisma-client';

export async function getBuilderWeeklyStats(builderId: string) {
  const builderWeeklyStats = await prisma.userWeeklyStats.findFirst({
    where: {
      userId: builderId
    }
  });

  return {
    rank: 1,
    gemsCollected: builderWeeklyStats?.gemsCollected || 0
  };
}

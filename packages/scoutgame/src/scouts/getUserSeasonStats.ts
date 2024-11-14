import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

export async function getUserSeasonStats(userId: string) {
  return prisma.userSeasonStats.findUnique({
    where: {
      userId_season: {
        userId,
        season: currentSeason
      }
    },
    select: {
      pointsEarnedAsScout: true
    }
  });
}

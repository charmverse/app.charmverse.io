import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export async function getUserSeasonStats(_userId: string) {
  return prisma.userSeasonStats.findUnique({
    where: {
      userId_season: {
        userId: _userId,
        season: currentSeason
      }
    },
    select: {
      pointsEarnedAsScout: true
    }
  });
}

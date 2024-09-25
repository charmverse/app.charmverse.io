import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';

export type BuilderStats = {
  seasonPoints?: number;
  allTimePoints?: number;
  rank?: number;
  gemsCollected?: number;
};

export async function getBuilderStats(builderId: string): Promise<BuilderStats> {
  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          rank: true,
          gemsCollected: true
        }
      }
    }
  });

  return {
    seasonPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder,
    allTimePoints: builder.userAllTimeStats[0]?.pointsEarnedAsBuilder,
    rank: builder.userWeeklyStats[0]?.rank,
    gemsCollected: builder.userWeeklyStats[0]?.gemsCollected
  };
}

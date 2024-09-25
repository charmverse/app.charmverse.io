import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

export async function getBuilderStats(builderId: string) {
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
      }
    }
  });

  return {
    seasonPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder,
    allTimePoints: builder.userAllTimeStats[0]?.pointsEarnedAsBuilder
  };
}

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export async function getScoutStats(scoutId: string) {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: scoutId
    },
    select: {
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsScout: true,
          nftsPurchased: true
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsScout: true
        }
      },
      nftPurchaseEvents: {
        distinct: 'builderNftId',
        where: {
          scoutId,
          builderNFT: {
            season: currentSeason
          }
        },
        select: {
          builderNftId: true
        }
      }
    }
  });

  return {
    allTimePoints: scout.userAllTimeStats[0]?.pointsEarnedAsScout,
    seasonPoints: scout.userSeasonStats[0]?.pointsEarnedAsScout,
    nftsPurchased: scout.userSeasonStats[0]?.nftsPurchased,
    buildersScouted: scout.nftPurchaseEvents.length
  };
}

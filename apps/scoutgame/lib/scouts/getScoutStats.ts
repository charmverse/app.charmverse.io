import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

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
          pointsEarnedAsScout: true
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsScout: true
        }
      },
      nftPurchaseEvents: {
        where: {
          scoutId,
          builderNFT: {
            season: currentSeason
          }
        },
        select: {
          tokensPurchased: true,
          builderNFT: {
            select: {
              builderId: true
            }
          }
        }
      }
    }
  });

  return {
    allTimePoints: scout.userAllTimeStats[0]?.pointsEarnedAsScout || 0,
    seasonPoints: scout.userSeasonStats[0]?.pointsEarnedAsScout || 0,
    nftsPurchased: scout.nftPurchaseEvents.reduce((acc, curr) => acc + curr.tokensPurchased, 0),
    buildersScouted: scout.nftPurchaseEvents.map((event) => event.builderNFT.builderId).length
  };
}

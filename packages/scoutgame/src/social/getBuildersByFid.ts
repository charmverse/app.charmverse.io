import { prisma } from '@charmverse/core/prisma-client';
import type { Last7DaysGems } from '@packages/scoutgame/builders/getTodaysHotBuilders';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { uniqueValues } from '@packages/utils/array';

export async function getBuildersByFid({
  fids,
  limit,
  season
}: {
  fids: number[];
  limit: number;
  season: string;
}): Promise<{ builders: BuilderInfo[] }> {
  const builders = await prisma.scout
    .findMany({
      where: {
        builderStatus: 'approved',
        builderNfts: {
          some: {
            season
          }
        },
        farcasterId: {
          in: uniqueValues(fids)
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        path: true,
        displayName: true,
        builderStatus: true,
        createdAt: true,
        builderNfts: {
          where: {
            season
          },
          select: {
            imageUrl: true,
            congratsImageUrl: true,
            currentPrice: true,
            nftSoldEvents: {
              distinct: 'scoutId'
            }
          }
        },
        builderCardActivities: {
          select: {
            last7Days: true
          }
        },
        userWeeklyStats: {
          where: {
            week: getCurrentWeek(),
            season
          },
          select: {
            rank: true
          }
        },
        userSeasonStats: {
          where: {
            season
          },
          select: {
            nftsSold: true
          }
        },
        userAllTimeStats: {
          select: {
            pointsEarnedAsBuilder: true
          }
        }
      }
    })
    .then((scouts) => {
      return scouts.map((scout) => ({
        id: scout.id,
        nftImageUrl: scout.builderNfts[0]?.imageUrl,
        congratsImageUrl: scout.builderNfts[0]?.congratsImageUrl,
        path: scout.path,
        displayName: scout.displayName,
        builderPoints: scout.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
        price: scout.builderNfts?.[0]?.currentPrice ?? 0,
        scoutedBy: scout.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
        rank: scout.userWeeklyStats[0]?.rank ?? -1,
        nftsSold: scout.userSeasonStats[0]?.nftsSold ?? 0,
        builderStatus: scout.builderStatus!,
        last7DaysGems: ((scout.builderCardActivities[0]?.last7Days as unknown as Last7DaysGems) || [])
          .map((gem) => gem.gemsCount)
          .slice(-7)
      }));
    });

  return {
    builders
  };
}

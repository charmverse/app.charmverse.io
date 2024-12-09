import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { uniqueValues } from '@packages/utils/array';

import { normalizeLast7DaysGems } from '../builders/utils/normalizeLast7DaysGems';

export async function getBuildersByFid({
  fids,
  limit,
  season,
  nftType = 'default'
}: {
  fids: number[];
  limit: number;
  season: string;
  nftType?: BuilderNftType;
}): Promise<{ builders: BuilderInfo[] }> {
  const builders = await prisma.scout
    .findMany({
      where: {
        builderStatus: 'approved',
        builderNfts: {
          some: {
            season,
            nftType
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
        farcasterId: true,
        builderNfts: {
          where: {
            season,
            nftType
          },
          select: {
            contractAddress: true,
            imageUrl: true,
            congratsImageUrl: true,
            currentPrice: true,
            nftSoldEvents: {
              distinct: 'scoutId'
            },
            nftType: true
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
        farcasterId: scout.farcasterId,
        last7DaysGems: normalizeLast7DaysGems(scout.builderCardActivities[0]),
        contractAddress: scout.builderNfts[0]?.contractAddress || '',
        nftType: scout.builderNfts[0]?.nftType || 'default'
      }));
    });

  return {
    builders
  };
}

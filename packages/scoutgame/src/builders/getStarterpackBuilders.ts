import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';

import { getCurrentWeek, currentSeason } from '../dates';
import type { Season } from '../dates';

import type { BuilderInfo } from './interfaces';

export async function getStarterpackBuilders({
  season = currentSeason,
  week = getCurrentWeek(),
  limit
}: {
  season?: Season;
  week?: string;
  limit?: number;
} = {}): Promise<BuilderInfo[]> {
  const starterPackBuilders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      builderNfts: {
        some: {
          season,
          nftType: BuilderNftType.starter_pack
        }
      }
    },
    take: limit,
    select: {
      id: true,
      path: true,
      avatar: true,
      displayName: true,
      farcasterId: true,
      builderNfts: {
        where: {
          season,
          nftType: BuilderNftType.starter_pack
        },
        select: {
          imageUrl: true,
          currentPrice: true,
          congratsImageUrl: true
        }
      },
      builderCardActivities: true,
      userSeasonStats: {
        where: {
          season
        },
        select: {
          pointsEarnedAsBuilder: true,
          nftsSold: true
        }
      },
      userWeeklyStats: {
        where: {
          season,
          week
        },
        select: {
          rank: true
        }
      }
    }
  });

  return starterPackBuilders.map((builder) => ({
    id: builder.id,
    path: builder.path,
    avatar: builder.avatar as string,
    displayName: builder.displayName,
    rank: builder.userWeeklyStats[0]?.rank || -1,
    price: builder.builderNfts[0]?.currentPrice,
    points: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    cards: builder.userSeasonStats[0]?.nftsSold || 0,
    builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    last7DaysGems: (builder.builderCardActivities[0]?.last7Days || []) as number[],
    nftsSold: builder.userSeasonStats[0]?.nftsSold || 0,
    builderStatus: 'approved',
    nftImageUrl: builder.builderNfts[0]?.imageUrl || '',
    nftType: BuilderNftType.starter_pack,
    farcasterId: builder.farcasterId,
    congratsImageUrl: builder.builderNfts[0]?.congratsImageUrl || ''
  }));
}

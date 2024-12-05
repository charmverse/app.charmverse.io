import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';

import type { Season } from '../dates';

import type { BuilderInfo } from './interfaces';

export async function getStarterpackBuilders({
  season,
  limit
}: {
  season: Season;
  limit?: number;
}): Promise<BuilderInfo[]> {
  const starterPackBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      user: {
        builderStatus: 'approved',
        builderNfts: {
          some: {
            season,
            nftType: BuilderNftType.starter_pack
          }
        }
      }
    },
    take: limit,
    select: {
      user: {
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
              currentPrice: true
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
          }
        }
      },
      rank: true
    }
  });

  return starterPackBuilders.map((builder) => ({
    id: builder.user.id,
    path: builder.user.path,
    avatar: builder.user.avatar as string,
    displayName: builder.user.displayName,
    rank: builder.rank || -1,
    price: builder.user.builderNfts[0]?.currentPrice,
    points: builder.user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    cards: builder.user.userSeasonStats[0]?.nftsSold || 0,
    builderPoints: builder.user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    last7DaysGems: (builder.user.builderCardActivities[0]?.last7Days || []) as number[],
    nftsSold: builder.user.userSeasonStats[0]?.nftsSold || 0,
    builderStatus: 'approved',
    nftImageUrl: builder.user.builderNfts[0]?.imageUrl || '',
    nftType: BuilderNftType.starter_pack,
    farcasterId: builder.user.farcasterId
  }));
}

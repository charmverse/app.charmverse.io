import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export type BuilderSearchResult = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: number;
};

export async function searchBuilders({
  path,
  limit = 10
}: {
  path: string;
  limit?: number;
}): Promise<BuilderSearchResult[]> {
  const builders = await prisma.scout.findMany({
    where: {
      path: {
        contains: path,
        mode: 'insensitive'
      }
    },
    take: limit,
    orderBy: {
      // Sort by similarity to the query
      _relevance: {
        fields: ['path'],
        search: path,
        sort: 'desc'
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      avatar: true,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          currentPrice: true,
          nftSoldEvents: {
            distinct: ['scoutId']
          }
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true
        }
      }
    }
  });

  return builders.map((builder) => ({
    id: builder.id,
    path: builder.path!,
    displayName: builder.displayName!,
    avatar: builder.avatar,
    seasonPoints: builder.userSeasonStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    allTimePoints: builder.userAllTimeStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    scoutedBy: builder.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
    price: Number(builder.builderNfts?.[0]?.currentPrice ?? 0)
  }));
}

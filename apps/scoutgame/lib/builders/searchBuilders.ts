import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

export type BuilderSearchResult = {
  id: string;
  username: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: number;
};

export async function searchBuilders({
  username,
  limit = 10
}: {
  username: string;
  limit?: number;
}): Promise<BuilderSearchResult[]> {
  const builders = await prisma.scout.findMany({
    where: {
      username: {
        contains: username,
        mode: 'insensitive'
      }
    },
    take: limit,
    orderBy: {
      // Sort by similarity to the query
      _relevance: {
        fields: ['username'],
        search: username,
        sort: 'desc'
      }
    },
    select: {
      id: true,
      username: true,
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
    username: builder.username,
    avatar: builder.avatar,
    seasonPoints: builder.userSeasonStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    allTimePoints: builder.userAllTimeStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    scoutedBy: builder.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
    price: Number(builder.builderNfts?.[0]?.currentPrice ?? 0)
  }));
}

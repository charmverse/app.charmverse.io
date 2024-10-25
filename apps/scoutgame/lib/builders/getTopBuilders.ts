import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/scoutgame/dates';
import { currentSeason } from '@packages/scoutgame/dates';
import { isTruthy } from '@root/lib/utils/types';

export type TopBuilderInfo = {
  id: string;
  username: string;
  avatar: string | null;
  seasonPoints: number;
  builderStatus: BuilderStatus;
  allTimePoints: number;
  scoutedBy: number;
  price: bigint;
  nftImageUrl: string;
};

export async function getTopBuilders({
  limit,
  season = currentSeason
}: { limit?: number; season?: Season } = {}): Promise<TopBuilderInfo[]> {
  const topBuilders = await prisma.userSeasonStats.findMany({
    where: {
      season,
      user: {
        builderStatus: 'approved'
      }
    },
    orderBy: {
      pointsEarnedAsBuilder: 'desc'
    },
    take: limit,
    select: {
      pointsEarnedAsBuilder: true,
      user: {
        select: {
          id: true,
          builderStatus: true,
          username: true,
          avatar: true,
          userAllTimeStats: {
            select: {
              pointsEarnedAsBuilder: true
            }
          },
          builderNfts: {
            where: {
              season
            },
            select: {
              currentPrice: true,
              imageUrl: true,
              nftSoldEvents: {
                distinct: 'scoutId',
                select: {
                  id: true
                }
              }
            }
          }
        }
      }
    }
  });

  return topBuilders
    .map((builder) => {
      const { user, pointsEarnedAsBuilder } = builder;
      const { id, username, avatar } = user;
      const nft = user.builderNfts[0];
      if (!nft) {
        return null;
      }

      return {
        id,
        username,
        avatar,
        nftImageUrl: nft.imageUrl,
        seasonPoints: pointsEarnedAsBuilder,
        allTimePoints: builder.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
        scoutedBy: nft.nftSoldEvents.length,
        builderStatus: user.builderStatus!,
        price: nft.currentPrice
      };
    })
    .filter((builder) => {
      return builder && (builder.scoutedBy > 0 || builder.seasonPoints > 0 || builder.allTimePoints > 0);
    })
    .filter(isTruthy);
}

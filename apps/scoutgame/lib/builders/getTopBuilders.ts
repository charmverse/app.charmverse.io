import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { isTruthy } from '@root/lib/utils/types';

export type TopBuilderInfo = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: bigint;
  nftImageUrl: string;
};

export async function getTopBuilders({ limit }: { limit: number }): Promise<TopBuilderInfo[]> {
  const topBuilders = await prisma.userSeasonStats.findMany({
    where: {
      season: currentSeason,
      user: {
        builderStatus: 'approved',
        builderNfts: {
          some: {
            season: currentSeason
          }
        }
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
          username: true,
          displayName: true,
          avatar: true,
          userAllTimeStats: {
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
              imageUrl: true,
              nftSoldEvents: {
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
      const { id, username, avatar, displayName } = user;
      const nft = user.builderNfts[0];
      if (!nft) {
        return null;
      }

      return {
        id,
        username,
        avatar,
        displayName,
        nftImageUrl: nft.imageUrl,
        seasonPoints: pointsEarnedAsBuilder,
        allTimePoints: builder.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
        scoutedBy: nft.nftSoldEvents.length,
        price: nft.currentPrice
      };
    })
    .filter(isTruthy);
}

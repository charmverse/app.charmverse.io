import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';

import { seasonQualifiedBuilderWhere } from './queries';

export type TopBuilderInfo = {
  id: string;
  username: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: number;
};

export async function getTopBuilders({ limit }: { limit: number }): Promise<TopBuilderInfo[]> {
  const topBuilders = await prisma.userSeasonStats.findMany({
    where: seasonQualifiedBuilderWhere,
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
      const { id, username, avatar } = user;
      const nft = user.builderNfts[0];
      if (!nft) {
        return null;
      }

      return {
        id,
        username,
        avatar,
        seasonPoints: pointsEarnedAsBuilder,
        allTimePoints: builder.user.userAllTimeStats[0].pointsEarnedAsBuilder,
        scoutedBy: nft.nftSoldEvents.length,
        price: Number(nft.currentPrice)
      };
    })
    .filter(isTruthy);
}

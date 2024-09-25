import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

import type { BuilderInfo } from './interfaces';
import { weeklyQualifiedBuilderWhere } from './queries';

export async function getTodaysHotBuilders({ limit }: { limit: number }): Promise<BuilderInfo[]> {
  const builders = await prisma.userWeeklyStats.findMany({
    where: weeklyQualifiedBuilderWhere,
    orderBy: {
      gemsCollected: 'desc'
    },
    take: limit,
    select: {
      gemsCollected: true,
      user: {
        select: {
          id: true,
          bannedAt: true,
          avatar: true,
          username: true,
          displayName: true,
          userSeasonStats: {
            where: {
              season: currentSeason
            },
            select: {
              pointsEarnedAsBuilder: true
            }
          },
          nftPurchaseEvents: {
            where: {
              builderNFT: {
                season: currentSeason
              }
            },
            distinct: ['scoutId'],
            select: {
              scoutId: true
            }
          },
          builderNfts: {
            where: {
              season: currentSeason
            },
            select: {
              currentPrice: true
            }
          }
        }
      }
    }
  });

  return builders.map((builder) => {
    const user = builder.user;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      builderPoints: user.userSeasonStats[0]?.pointsEarnedAsBuilder,
      price: user.builderNfts[0]?.currentPrice,
      nftsSold: user.nftPurchaseEvents.length,
      gems: builder.gemsCollected,
      avatar: user.avatar,
      scoutedBy: user.nftPurchaseEvents.length,
      isBanned: !!user.bannedAt
    };
  });
}

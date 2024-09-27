import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

import { BasicUserInfoSelect } from 'lib/users/queries';

import type { BuilderInfo } from './interfaces';
import { weeklyQualifiedBuilderWhere } from './queries';

export async function getTodaysHotBuilders({ limit }: { limit: number }): Promise<BuilderInfo[]> {
  const builders = await prisma.userWeeklyStats.findMany({
    where: weeklyQualifiedBuilderWhere,
    orderBy: {
      rank: 'asc'
    },
    take: limit,
    select: {
      gemsCollected: true,
      user: {
        select: {
          ...BasicUserInfoSelect,
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
              scoutId: true,
              tokensPurchased: true
            }
          },
          builderNfts: {
            where: {
              season: currentSeason
            },
            select: {
              currentPrice: true,
              imageUrl: true
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
      builderPoints: user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      price: user.builderNfts[0]?.currentPrice,
      nftsSold: user.nftPurchaseEvents.reduce((acc, event) => acc + event.tokensPurchased, 0),
      gems: builder.gemsCollected,
      avatar: user.builderNfts[0]?.imageUrl,
      scoutedBy: user.nftPurchaseEvents.length,
      builderStatus: user.builderStatus
    };
  });
}

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';

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
      user: {
        select: {
          id: true,
          bannedAt: true,
          avatar: true,
          username: true,
          displayName: true,
          userWeeklyStats: {
            select: {
              gemsCollected: true
            },
            where: {
              week: getCurrentWeek()
            }
          },
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
      builderPoints: user.userSeasonStats[0].pointsEarnedAsBuilder,
      price: Number(user.builderNfts[0].currentPrice),
      nfts: user.nftPurchaseEvents.length,
      gems: user.userWeeklyStats[0].gemsCollected,
      // TODO: get nft avatar which is guaranteed to exist
      nftAvatar: user.avatar || '',
      scoutedBy: user.nftPurchaseEvents.length,
      isBanned: !!user.bannedAt
    };
  });
}

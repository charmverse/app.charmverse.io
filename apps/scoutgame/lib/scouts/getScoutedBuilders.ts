import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { BasicUserInfoSelect } from 'lib/users/queries';

import type { BuilderInfo } from '../builders/interfaces';

export async function getScoutedBuilders({ scoutId }: { scoutId: string }): Promise<BuilderInfo[]> {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season: currentSeason
      },
      scoutId
    },
    select: {
      tokensPurchased: true,
      builderNFT: {
        select: {
          builderId: true
        }
      }
    }
  });

  const uniqueBuilderIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.builderNFT.builderId)));

  const builders = await prisma.scout.findMany({
    where: {
      id: {
        in: uniqueBuilderIds
      }
    },
    select: {
      ...BasicUserInfoSelect,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          nftsSold: true,
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          imageUrl: true,
          currentPrice: true,
          _count: {
            select: {
              nftSoldEvents: {
                where: {
                  scoutId
                }
              }
            }
          }
        }
      },
      builderStatus: true,
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          gemsCollected: true
        }
      }
    }
  });

  return builders.map((builder) => {
    const nftsSoldToScout = nftPurchaseEvents
      .filter((event) => event.builderNFT.builderId === builder.id)
      .reduce((acc, event) => acc + event.tokensPurchased, 0);
    return {
      id: builder.id,
      nftImageUrl: builder.builderNfts[0]?.imageUrl,
      username: builder.username,
      displayName: builder.displayName,
      builderStatus: builder.builderStatus,
      builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected ?? 0,
      nftsSold: builder.userSeasonStats[0]?.nftsSold ?? 0,
      nftsSoldToScout,
      isBanned: builder.builderStatus === 'banned',
      price: builder.builderNfts[0]?.currentPrice ?? 0,
      boughtNftsCount: undefined
      // boughtNftsCount: builder.builderNfts[0]?._count?.nftSoldEvents ?? 0
    };
  });
}

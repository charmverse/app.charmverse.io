import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { isProdEnv } from '@root/config/constants';

import { BasicUserInfoSelect } from 'lib/users/queries';

import type { BuilderInfo } from './interfaces';
import { weeklyQualifiedBuilderWhere } from './queries';

const preselectedBuilderIds = [
  '9a7d9dd6-298d-4e92-9f71-ff972abd1132',
  '1b152457-fec5-482e-98da-39c78ceca130',
  'e9d39cf3-ac24-404c-9561-6d10ce2c59f5',
  'd5ca4ab2-5290-4f77-896f-d855f8eea9b5',
  '1552d2e0-4a2f-4090-be59-36d60c81a9c4',
  '78af5174-0d51-4c46-bd03-b93906ea59db',
  '1fb7b66d-3250-481c-bdde-d20dda223b8b',
  'e387f960-ff07-40fa-abc3-f8adacc994a1',
  '9320d5fd-0557-49ae-8bae-6da6f4af0634'
];

export async function getTodaysHotBuilders(): Promise<BuilderInfo[]> {
  if (isProdEnv) {
    const builders = await prisma.scout.findMany({
      where: {
        id: {
          in: preselectedBuilderIds
        }
      },
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
        userWeeklyStats: {
          where: {
            season: currentSeason
          },
          select: {
            gemsCollected: true
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
    });

    return builders
      .map((builder) => {
        return {
          id: builder.id,
          username: builder.username,
          displayName: builder.displayName,
          builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
          price: builder.builderNfts[0]?.currentPrice,
          nftImageUrl: builder.builderNfts[0]?.imageUrl,
          nftsSold: builder.nftPurchaseEvents.reduce((acc, event) => acc + event.tokensPurchased, 0),
          gems: builder.userWeeklyStats[0]?.gemsCollected || 0,
          scoutedBy: builder.nftPurchaseEvents.length,
          builderStatus: builder.builderStatus
        };
      })
      .sort((a, b) => preselectedBuilderIds.indexOf(a.id) - preselectedBuilderIds.indexOf(b.id));
  }

  const builders = await prisma.userWeeklyStats.findMany({
    where: weeklyQualifiedBuilderWhere,
    orderBy: {
      rank: 'asc'
    },
    take: 10,
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

  const mappedBuilders = builders.map((builder) => {
    const user = builder.user;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      builderPoints: user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      price: user.builderNfts[0]?.currentPrice,
      nftImageUrl: user.builderNfts[0]?.imageUrl,
      nftsSold: user.nftPurchaseEvents.reduce((acc, event) => acc + event.tokensPurchased, 0),
      gems: builder.gemsCollected,
      scoutedBy: user.nftPurchaseEvents.length,
      builderStatus: user.builderStatus
    };
  });

  return mappedBuilders;
}

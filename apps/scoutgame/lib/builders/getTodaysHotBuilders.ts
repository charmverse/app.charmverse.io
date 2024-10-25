import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { isProdEnv } from '@root/config/constants';

import { BasicUserInfoSelect } from 'lib/users/queries';

import type { BuilderInfo } from './interfaces';

const preselectedBuilderUsernames = [
  'samkuhlmann',
  'earth2travis',
  'dan13ram.eth',
  'andreitr.eth',
  'stephancill',
  'piesrtasty',
  'thecreative.eth',
  'gregfromstl',
  'millzdoteth',
  'icemonkey'
];

export async function getTodaysHotBuilders(): Promise<BuilderInfo[]> {
  if (isProdEnv) {
    const builders = await prisma.scout.findMany({
      where: {
        builderStatus: 'approved',
        username: {
          in: preselectedBuilderUsernames
        }
      },
      select: {
        ...BasicUserInfoSelect,
        userSeasonStats: {
          where: {
            season: currentSeason
          },
          select: {
            pointsEarnedAsBuilder: true,
            nftsSold: true
          }
        },
        userWeeklyStats: {
          where: {
            week: getCurrentWeek()
          },
          select: {
            rank: true
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
          builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
          price: builder.builderNfts[0]?.currentPrice ?? 0,
          nftImageUrl: builder.builderNfts[0]?.imageUrl,
          nftsSold: builder.userSeasonStats[0]?.nftsSold || 0,
          builderStatus: builder.builderStatus!,
          rank: builder.userWeeklyStats[0]?.rank || -1
        };
      })
      .sort((a, b) => preselectedBuilderUsernames.indexOf(a.id) - preselectedBuilderUsernames.indexOf(b.id));
  }

  const builders = await prisma.userWeeklyStats.findMany({
    where: {
      week: getCurrentWeek(),
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
              pointsEarnedAsBuilder: true,
              nftsSold: true
            }
          },
          userWeeklyStats: {
            where: {
              week: getCurrentWeek()
            },
            select: {
              rank: true
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
      builderPoints: user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      price: user.builderNfts[0]?.currentPrice ?? 0,
      nftImageUrl: user.builderNfts[0]?.imageUrl,
      nftsSold: user.userSeasonStats[0]?.nftsSold || 0,
      rank: user.userWeeklyStats[0]?.rank || -1,
      scoutedBy: user.nftPurchaseEvents.length,
      builderStatus: user.builderStatus!
    };
  });

  return mappedBuilders;
}

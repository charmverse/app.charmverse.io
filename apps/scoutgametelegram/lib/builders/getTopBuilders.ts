import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

export type TopBuildersSortBy = 'cards' | 'points' | 'price' | 'rank';

export type TopBuilderInfo = {
  path: string;
  avatar: string;
  displayName: string;
  rank: number;
  price: bigint;
  points: number;
  cards: number;
};

export async function getTopBuilders({
  limit = 200,
  sortBy = 'rank',
  order = 'asc'
}: {
  limit?: number;
  sortBy?: TopBuildersSortBy;
  order?: 'asc' | 'desc';
}) {
  if (sortBy === 'rank') {
    const builders = await prisma.userWeeklyStats.findMany({
      where: {
        week: getCurrentWeek(),
        user: {
          builderStatus: 'approved'
        }
      },
      orderBy: {
        rank: order
      },
      take: limit,
      select: {
        user: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            builderNfts: {
              where: {
                season: currentSeason
              },
              select: {
                currentPrice: true
              }
            },
            userSeasonStats: {
              select: {
                pointsEarnedAsBuilder: true,
                nftsSold: true
              }
            }
          }
        },
        rank: true
      }
    });

    return builders.map((builder) => ({
      path: builder.user.path,
      avatar: builder.user.avatar as string,
      displayName: builder.user.displayName,
      rank: builder.rank || -1,
      price: builder.user.builderNfts[0].currentPrice,
      points: builder.user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      cards: builder.user.userSeasonStats[0]?.nftsSold || 0
    }));
  } else if (sortBy === 'points') {
    const builders = await prisma.userSeasonStats.findMany({
      where: {
        user: {
          builderStatus: 'approved'
        },
        pointsEarnedAsBuilder: {
          gt: 0
        },
        season: currentSeason
      },
      orderBy: {
        pointsEarnedAsBuilder: order
      },
      take: limit,
      select: {
        user: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            userWeeklyStats: {
              select: {
                rank: true
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
        },
        nftsSold: true,
        pointsEarnedAsBuilder: true
      }
    });
    return builders.map((builder) => ({
      path: builder.user.path,
      avatar: builder.user.avatar as string,
      displayName: builder.user.displayName,
      rank: builder.user.userWeeklyStats[0]?.rank || -1,
      price: builder.user.builderNfts[0].currentPrice,
      points: builder.pointsEarnedAsBuilder || 0,
      cards: builder.nftsSold || 0
    }));
  } else if (sortBy === 'price') {
    const builders = await prisma.builderNft.findMany({
      where: {
        season: currentSeason,
        builder: {
          builderStatus: 'approved'
        }
      },
      orderBy: {
        currentPrice: order
      },
      take: limit,
      select: {
        builder: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            userWeeklyStats: {
              select: {
                rank: true
              }
            },
            userSeasonStats: {
              select: {
                pointsEarnedAsBuilder: true,
                nftsSold: true
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
        },
        currentPrice: true
      }
    });

    return builders.map((builder) => ({
      path: builder.builder.path,
      avatar: builder.builder.avatar as string,
      displayName: builder.builder.displayName,
      rank: builder.builder.userWeeklyStats[0]?.rank || -1,
      price: builder.currentPrice,
      points: builder.builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      cards: builder.builder.userSeasonStats[0]?.nftsSold || 0
    }));
  } else if (sortBy === 'cards') {
    const builders = await prisma.userSeasonStats.findMany({
      where: {
        user: {
          builderStatus: 'approved'
        },
        season: currentSeason
      },
      orderBy: {
        nftsSold: order
      },
      take: limit,
      select: {
        user: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            userWeeklyStats: {
              select: {
                rank: true
              }
            },
            builderNfts: {
              where: {
                season: currentSeason
              }
            }
          }
        },
        pointsEarnedAsBuilder: true,
        nftsSold: true
      }
    });

    return builders.map((builder) => ({
      path: builder.user.path,
      avatar: builder.user.avatar as string,
      displayName: builder.user.displayName,
      rank: builder.user.userWeeklyStats[0]?.rank || -1,
      price: builder.user.builderNfts[0].currentPrice,
      points: builder.pointsEarnedAsBuilder || 0,
      cards: builder.nftsSold || 0
    }));
  }

  log.error(`Invalid sortBy provided: ${sortBy}`);

  return [];
}

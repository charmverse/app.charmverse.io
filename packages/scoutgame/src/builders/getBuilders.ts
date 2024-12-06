import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';

import { currentSeason, getCurrentWeek } from '../dates';

export type BuildersSortBy = 'cards' | 'points' | 'price' | 'rank';

export type BuilderMetadata = {
  path: string;
  avatar: string;
  displayName: string;
  rank: number;
  price: bigint;
  points: number;
  cards: number;
};

export async function getBuilders({
  limit = 200,
  sortBy = 'rank',
  order = 'asc'
}: {
  limit?: number;
  sortBy?: BuildersSortBy;
  order?: 'asc' | 'desc';
}): Promise<BuilderMetadata[]> {
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
                season: currentSeason,
                nftType: BuilderNftType.default
              },
              select: {
                currentPrice: true
              }
            },
            userSeasonStats: {
              where: {
                season: currentSeason
              },
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
      price: builder.user.builderNfts[0]?.currentPrice,
      points: builder.user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      cards: builder.user.userSeasonStats[0]?.nftsSold || 0
    }));
  } else if (sortBy === 'points') {
    const builders = await prisma.userSeasonStats.findMany({
      where: {
        user: {
          builderStatus: 'approved'
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
              where: {
                week: getCurrentWeek()
              },
              select: {
                rank: true
              }
            },
            builderNfts: {
              where: {
                season: currentSeason,
                nftType: BuilderNftType.default
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
      price: builder.user.builderNfts[0]?.currentPrice,
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
              where: {
                week: getCurrentWeek()
              },
              select: {
                rank: true
              }
            },
            userSeasonStats: {
              where: {
                season: currentSeason
              },
              select: {
                pointsEarnedAsBuilder: true,
                nftsSold: true
              }
            },
            builderNfts: {
              where: {
                season: currentSeason,
                nftType: BuilderNftType.default
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
              where: {
                week: getCurrentWeek()
              },
              select: {
                rank: true
              }
            },
            builderNfts: {
              where: {
                season: currentSeason,
                nftType: BuilderNftType.default
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
      price: builder.user.builderNfts[0]?.currentPrice,
      points: builder.pointsEarnedAsBuilder || 0,
      cards: builder.nftsSold || 0
    }));
  }

  log.error(`Invalid sortBy provided: ${sortBy}`);

  return [];
}

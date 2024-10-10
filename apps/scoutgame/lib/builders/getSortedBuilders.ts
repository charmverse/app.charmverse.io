import { prisma } from '@charmverse/core/prisma-client';
import { getPreviousWeek } from '@packages/scoutgame/dates';

import type { BuilderInfo } from './interfaces';

export type BuildersSort = 'top' | 'hot' | 'new';

export async function getSortedBuilders({
  sort,
  limit,
  week,
  season,
  cursor
}: {
  sort: BuildersSort;
  limit: number;
  week: string;
  season: string;
  cursor?: string;
}): Promise<{ builders: BuilderInfo[]; nextCursor: string | null; hasMore: boolean }> {
  // new is based on the most recent builder
  // top is based on the most gems earned in their user week stats
  // hot is based on the most points earned in the previous user week stats
  let builders: BuilderInfo[];

  switch (sort) {
    case 'new':
      builders = await prisma.scout
        .findMany({
          where: {
            builderStatus: 'approved',
            builderNfts: {
              some: {
                season
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            username: true,
            builderStatus: true,
            createdAt: true,
            builderNfts: {
              where: {
                season
              },
              select: {
                imageUrl: true,
                currentPrice: true,
                nftSoldEvents: {
                  distinct: 'scoutId'
                }
              }
            },
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                gemsCollected: true
              }
            },
            userSeasonStats: {
              where: {
                season
              },
              select: {
                nftsSold: true
              }
            },
            userAllTimeStats: {
              select: {
                pointsEarnedAsBuilder: true
              }
            }
          }
        })
        .then((scouts) => {
          return scouts.map((scout) => ({
            id: scout.id,
            nftImageUrl: scout.builderNfts[0]?.imageUrl,
            username: scout.username,
            displayName: scout.username,
            builderPoints: scout.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: scout.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: scout.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gemsCollected: scout.userWeeklyStats[0]?.gemsCollected ?? 0,
            nftsSold: scout.userSeasonStats[0]?.nftsSold ?? 0,
            builderStatus: scout.builderStatus
          }));
        });
      break;

    // show top builders from this week
    case 'hot':
      builders = await prisma.userWeeklyStats
        .findMany({
          where: {
            user: {
              builderStatus: 'approved',
              builderNfts: {
                some: {
                  season
                }
              }
            },
            week
          },
          orderBy: {
            rank: 'asc'
          },
          take: limit + 1,
          cursor: cursor
            ? {
                userId_week: {
                  userId: cursor,
                  week
                }
              }
            : undefined,
          select: {
            user: {
              select: {
                id: true,
                username: true,
                builderStatus: true,
                builderNfts: {
                  where: {
                    season
                  },
                  select: {
                    currentPrice: true,
                    imageUrl: true,
                    nftSoldEvents: {
                      distinct: 'scoutId'
                    }
                  }
                },
                userAllTimeStats: {
                  select: {
                    pointsEarnedAsBuilder: true
                  }
                },
                userSeasonStats: {
                  where: {
                    season
                  },
                  select: {
                    nftsSold: true
                  }
                }
              }
            },
            gemsCollected: true
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            id: stat.user.id,
            nftImageUrl: stat.user.builderNfts[0]?.imageUrl,
            username: stat.user.username,
            displayName: stat.user.username,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: stat.user.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: stat.user.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gemsCollected: stat.gemsCollected,
            nftsSold: stat.user.userSeasonStats[0]?.nftsSold ?? 0,
            builderStatus: stat.user.builderStatus
          }))
        );
      break;

    // show top builders from last week
    case 'top': {
      const previousWeek = getPreviousWeek(week);

      builders = await prisma.userWeeklyStats
        .findMany({
          where: {
            week: previousWeek,
            user: {
              builderStatus: 'approved',
              builderNfts: {
                some: {
                  season
                }
              }
            }
          },
          orderBy: { rank: 'asc' },
          take: limit + 1,
          cursor: cursor
            ? {
                userId_week: {
                  userId: cursor,
                  week: previousWeek
                }
              }
            : undefined,
          select: {
            user: {
              select: {
                id: true,
                username: true,
                builderStatus: true,
                userAllTimeStats: {
                  select: {
                    pointsEarnedAsBuilder: true
                  }
                },
                userSeasonStats: {
                  where: {
                    season
                  },
                  select: {
                    nftsSold: true
                  }
                },
                userWeeklyStats: {
                  where: {
                    week
                  },
                  select: {
                    gemsCollected: true
                  }
                },
                builderNfts: {
                  where: {
                    season
                  },
                  select: {
                    currentPrice: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            id: stat.user.id,
            nftImageUrl: stat.user.builderNfts[0]?.imageUrl,
            username: stat.user.username,
            displayName: stat.user.username,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: stat.user.builderNfts?.[0]?.currentPrice ?? 0,
            gemsCollected: stat.user.userWeeklyStats[0]?.gemsCollected ?? 0,
            nftsSold: stat.user.userSeasonStats[0]?.nftsSold ?? 0,
            builderStatus: stat.user.builderStatus
          }))
        );
      break;
    }

    default:
      throw new Error(`Invalid sort option: ${sort}`);
  }

  const nextCursor = builders.length > limit ? builders[limit].id : null;
  const hasMore = builders.length > limit;

  return { builders: builders.slice(0, limit), nextCursor, hasMore };
}

import { prisma } from '@charmverse/core/prisma-client';
import { getPreviousWeek } from '@packages/scoutgame/dates';

import type { Last7DaysGems } from './getTodaysHotBuilders';
import type { BuilderInfo } from './interfaces';

export type BuildersSort = 'top' | 'hot' | 'new';

export type CompositeCursor = {
  userId: string;
  rank?: number | null;
};

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
  cursor: CompositeCursor | null;
}): Promise<{ builders: BuilderInfo[]; nextCursor: CompositeCursor | null }> {
  switch (sort) {
    case 'new': {
      const builders = await prisma.scout
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
          skip: cursor ? 1 : 0,
          take: limit,
          cursor: cursor ? { id: cursor.userId } : undefined,
          select: {
            id: true,
            username: true,
            path: true,
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
            builderCardActivities: {
              select: {
                last7Days: true
              }
            },
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                rank: true
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
            path: scout.path,
            builderPoints: scout.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: scout.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: scout.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            rank: scout.userWeeklyStats[0]?.rank ?? -1,
            nftsSold: scout.userSeasonStats[0]?.nftsSold ?? 0,
            builderStatus: scout.builderStatus!,
            last7DaysGems: ((scout.builderCardActivities[0]?.last7Days as unknown as Last7DaysGems) || [])
              .map((gem) => gem.gemsCount)
              .slice(-7)
          }));
        });
      const userId = builders[builders.length - 1]?.id;
      return { builders, nextCursor: builders.length === limit ? { userId, rank: null } : null };
    }
    // show top builders from this week
    case 'hot': {
      const builders = await prisma.userWeeklyStats
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
          skip: cursor ? 1 : 0,
          take: limit,
          cursor: cursor
            ? {
                rank: cursor.rank,
                userId_week: {
                  userId: cursor.userId,
                  week
                }
              }
            : undefined,
          select: {
            rank: true,
            user: {
              select: {
                id: true,
                username: true,
                path: true,
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
                builderCardActivities: {
                  select: {
                    last7Days: true
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
            }
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            id: stat.user.id,
            rank: stat.rank ?? -1,
            nftImageUrl: stat.user.builderNfts[0]?.imageUrl,
            username: stat.user.username,
            path: stat.user.path,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: stat.user.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: stat.user.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            nftsSold: stat.user.userSeasonStats[0]?.nftsSold ?? 0,
            builderStatus: stat.user.builderStatus!,
            last7DaysGems: ((stat.user.builderCardActivities[0]?.last7Days as unknown as Last7DaysGems) || [])
              .map((gem) => gem.gemsCount)
              .slice(-7)
          }))
        );
      const userId = builders[builders.length - 1]?.id;
      const rank = builders[builders.length - 1]?.rank;
      return { builders, nextCursor: builders.length === limit ? { userId, rank } : null };
    }

    // show top builders from last week
    case 'top': {
      const previousWeek = getPreviousWeek(week);

      const builders = await prisma.userWeeklyStats
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
          skip: cursor ? 1 : 0,
          take: limit,
          cursor: cursor
            ? {
                rank: cursor.rank,
                userId_week: {
                  userId: cursor.userId,
                  week: previousWeek
                }
              }
            : undefined,
          select: {
            rank: true,
            user: {
              select: {
                id: true,
                username: true,
                path: true,
                builderStatus: true,
                userAllTimeStats: {
                  select: {
                    pointsEarnedAsBuilder: true
                  }
                },
                builderCardActivities: {
                  select: {
                    last7Days: true
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
            rank: stat.rank ?? -1,
            nftImageUrl: stat.user.builderNfts[0]?.imageUrl,
            username: stat.user.username,
            path: stat.user.path,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: stat.user.builderNfts?.[0]?.currentPrice ?? 0,
            nftsSold: stat.user.userSeasonStats[0]?.nftsSold ?? 0,
            builderStatus: stat.user.builderStatus!,
            last7DaysGems: ((stat.user.builderCardActivities[0]?.last7Days as unknown as Last7DaysGems) || [])
              .map((gem) => gem.gemsCount)
              .slice(-7)
          }))
        );
      const userId = builders[builders.length - 1]?.id;
      const rank = builders[builders.length - 1]?.rank;
      return { builders, nextCursor: builders.length === limit ? { userId, rank } : null };
    }

    default:
      throw new Error(`Invalid sort option: ${sort}`);
  }
}

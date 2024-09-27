import { prisma } from '@charmverse/core/prisma-client';
import { getPreviousWeek } from '@packages/scoutgame/dates';

import type { BuilderInfo } from './interfaces';

export type BuildersSort = 'top' | 'hot' | 'new';

export async function getSortedBuilders({
  sort,
  limit,
  week,
  season
}: {
  sort: BuildersSort;
  limit: number;
  week: string;
  season: string;
}): Promise<BuilderInfo[]> {
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
          take: limit,
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
            avatar: scout.builderNfts[0]?.imageUrl,
            username: scout.username,
            displayName: scout.username,
            builderPoints: scout.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: scout.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: scout.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gems: scout.userWeeklyStats[0]?.gemsCollected ?? 0,
            builderStatus: scout.builderStatus
          }));
        });
      break;

    case 'top':
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
          take: limit,
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
                }
              }
            },
            gemsCollected: true
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            id: stat.user.id,
            avatar: stat.user.builderNfts[0]?.imageUrl,
            username: stat.user.username,
            displayName: stat.user.username,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: stat.user.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: stat.user.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gems: stat.gemsCollected,
            builderStatus: stat.user.builderStatus
          }))
        );
      break;

    case 'hot': {
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
          take: limit,
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
                }
              }
            },
            gemsCollected: true
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            id: stat.user.id,
            avatar: stat.user.builderNfts[0]?.imageUrl,
            username: stat.user.username,
            displayName: stat.user.username,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: stat.user.builderNfts?.[0]?.currentPrice ?? 0,
            scoutedBy: stat.user.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gems: stat.gemsCollected,
            builderStatus: stat.user.builderStatus
          }))
        );
      break;
    }

    default:
      throw new Error(`Invalid sort option: ${sort}`);
  }

  return builders;
}

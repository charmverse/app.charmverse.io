import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek, getLastWeek } from '@packages/scoutgame/utils';

import type { BuilderInfo } from './interfaces';

export type BuildersSort = 'top' | 'hot' | 'new';

export async function getSortedBuilders({
  sort,
  limit
}: {
  sort: BuildersSort;
  limit: number;
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
            bannedAt: null,
            builder: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit,
          select: {
            id: true,
            username: true,
            avatar: true,
            createdAt: true,
            builderNfts: {
              where: {
                season: currentSeason
              },
              select: {
                currentPrice: true,
                nftSoldEvents: {
                  distinct: 'scoutId'
                }
              }
            },
            userWeeklyStats: {
              where: {
                week: getCurrentWeek()
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
        .then((scouts) =>
          scouts.map((scout) => ({
            id: scout.id,
            avatar: scout.avatar,
            username: scout.username,
            displayName: scout.username,
            builderPoints: scout.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: Number(scout.builderNfts?.[0]?.currentPrice ?? 0),
            scoutedBy: scout.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gems: scout.userWeeklyStats[0]?.gemsCollected ?? 0
          }))
        );
      break;

    case 'top':
      builders = await prisma.userWeeklyStats
        .findMany({
          where: {
            user: {
              bannedAt: null,
              builder: true
            },
            week: getCurrentWeek()
          },
          orderBy: {
            gemsCollected: 'desc'
          },
          take: limit,
          select: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                builderNfts: {
                  where: {
                    season: currentSeason
                  },
                  select: {
                    currentPrice: true,
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
            avatar: stat.user.avatar,
            username: stat.user.username,
            displayName: stat.user.username,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: Number(stat.user.builderNfts?.[0]?.currentPrice ?? 0),
            scoutedBy: stat.user.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gems: stat.gemsCollected
          }))
        );
      break;

    case 'hot': {
      const previousWeek = getLastWeek();

      builders = await prisma.userWeeklyStats
        .findMany({
          where: {
            week: previousWeek,
            user: {
              bannedAt: null,
              builder: true
            }
          },
          orderBy: [{ week: 'desc' }, { gemsCollected: 'desc' }],
          take: limit,
          select: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                userAllTimeStats: {
                  select: {
                    pointsEarnedAsBuilder: true
                  }
                },
                builderNfts: {
                  where: {
                    season: currentSeason
                  },
                  select: {
                    currentPrice: true,
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
            avatar: stat.user.avatar,
            username: stat.user.username,
            displayName: stat.user.username,
            builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
            price: Number(stat.user.builderNfts?.[0]?.currentPrice ?? 0),
            scoutedBy: stat.user.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
            gems: stat.gemsCollected
          }))
        );
      break;
    }

    default:
      throw new Error(`Invalid sort option: ${sort}`);
  }

  return builders;
}

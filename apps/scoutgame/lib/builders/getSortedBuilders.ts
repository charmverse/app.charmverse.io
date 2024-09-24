import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getLastWeek } from '@packages/scoutgame/utils';

import type { BuilderUserInfo } from './interfaces';

export type BuildersSort = 'top' | 'hot' | 'new';

export async function getSortedBuilders({
  sort,
  limit
}: {
  sort: BuildersSort;
  limit: number;
}): Promise<BuilderUserInfo[]> {
  // new is based on the most recent builder
  // top is based on the most gems earned in their user week stats
  // hot is based on the most points earned in the previous user week stats
  let builders: BuilderUserInfo[];

  switch (sort) {
    case 'new':
      builders = await prisma.scout
        .findMany({
          where: {
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
            createdAt: true
          }
        })
        .then((scouts) =>
          scouts.map((scout) => ({
            ...scout,
            gems: 0,
            scoutedBy: 0,
            nftsSold: 0,
            price: 0
          }))
        );
      break;

    case 'top':
      builders = await prisma.userWeeklyStats
        .findMany({
          where: {
            user: {
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
                avatar: true
              }
            },
            gemsCollected: true
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            ...stat.user,
            gems: stat.gemsCollected,
            nftsSold: 0,
            scoutedBy: 0,
            price: 0
          }))
        );
      break;

    case 'hot': {
      const previousWeek = getLastWeek();

      builders = await prisma.userWeeklyStats
        .findMany({
          where: {
            user: {
              builder: true
            },
            week: previousWeek
          },
          orderBy: [{ week: 'desc' }, { gemsCollected: 'desc' }],
          take: limit,
          select: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            gemsCollected: true
          }
        })
        .then((stats) =>
          stats.map((stat) => ({
            ...stat.user,
            gems: stat.gemsCollected,
            nftsSold: 0,
            scoutedBy: 0,
            price: 0
          }))
        );
      break;
    }

    default:
      throw new Error(`Invalid sort option: ${sort}`);
  }

  return builders;
}

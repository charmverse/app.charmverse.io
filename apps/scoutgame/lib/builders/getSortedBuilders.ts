import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/builderNfts/constants';
import { getLastWeek } from '@packages/scoutgame/utils';

import { getBuilders } from './getBuilders';
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

  switch (sort) {
    case 'new':
      return getBuilders({
        orderBy: {
          createdAt: 'desc'
        },
        limit,
        where: {
          season: currentSeason,
          builder: {
            bannedAt: null
          }
        }
      });

    case 'top':
      // eslint-disable-next-line no-case-declarations
      const topUsers = await prisma.userWeeklyStats.findMany({
        orderBy: {
          gemsCollected: 'desc'
        },
        take: limit
      });

      return getBuilders({
        limit,
        where: {
          builderId: {
            in: topUsers.map((userStats) => userStats.userId)
          }
        }
      }).then((_builders) =>
        _builders.sort((a, b) => {
          const aIndex = topUsers.findIndex((user) => user.userId === a.id);
          const bIndex = topUsers.findIndex((user) => user.userId === b.id);
          return aIndex - bIndex;
        })
      );

    case 'hot': {
      const previousWeek = getLastWeek();

      return prisma.userWeeklyStats
        .findMany({
          where: {
            week: previousWeek
          },
          orderBy: {
            // TODO - Use points instead
            gemsCollected: 'desc'
          },
          take: limit,
          select: {
            user: {
              select: {
                id: true
              }
            }
          }
        })
        .then((stats) => getBuilders({ limit, where: { builderId: { in: stats.map((s) => s.user.id) } } }));
    }

    default:
      throw new Error(`Invalid sort option: ${sort}`);
  }
}

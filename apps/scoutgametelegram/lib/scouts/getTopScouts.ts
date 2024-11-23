import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export type TopScoutsSortBy = 'cards' | 'points' | 'builders' | 'rank';

export type TopScoutInfo = {
  path: string;
  avatar: string;
  displayName: string;
  rank: number;
  points: number;
  cards: number;
  builders: number;
};

export async function getTopScouts({
  limit = 200,
  sortBy = 'rank',
  order = 'asc'
}: {
  limit?: number;
  sortBy?: TopScoutsSortBy;
  order?: 'asc' | 'desc';
}) {
  // First get all users sorted by points to establish ranks
  const allUsers = await prisma.userSeasonStats.findMany({
    where: {
      pointsEarnedAsScout: {
        gt: 0
      },
      season: currentSeason
    },
    orderBy: {
      pointsEarnedAsScout: 'desc'
    },
    select: {
      user: {
        select: {
          path: true
        }
      }
    }
  });

  // Create a map of user path to their rank
  const rankMap = new Map(allUsers.map((user, index) => [user.user.path, index + 1]));

  if (sortBy === 'points' || sortBy === 'rank') {
    const scouts = await prisma.userSeasonStats.findMany({
      where: {
        pointsEarnedAsScout: {
          gt: 0
        },
        season: currentSeason
      },
      take: limit,
      select: {
        user: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            nftPurchaseEvents: {
              distinct: ['builderNftId']
            }
          }
        },
        nftsPurchased: true,
        pointsEarnedAsScout: true
      }
    });

    return scouts
      .map((scout) => ({
        path: scout.user.path,
        avatar: scout.user.avatar as string,
        displayName: scout.user.displayName,
        rank: rankMap.get(scout.user.path) || 0,
        points: scout.pointsEarnedAsScout || 0,
        cards: scout.nftsPurchased || 0,
        builders: scout.user.nftPurchaseEvents.length
      }))
      .sort((a, b) => {
        if (sortBy === 'points') {
          return order === 'asc' ? a.points - b.points : b.points - a.points;
        } else {
          return order === 'asc' ? a.rank - b.rank : b.rank - a.rank;
        }
      });
  } else if (sortBy === 'cards' || sortBy === 'builders') {
    const builders = await prisma.userSeasonStats.findMany({
      where: {
        season: currentSeason,
        pointsEarnedAsScout: {
          gt: 0
        }
      },
      orderBy: {
        nftsPurchased: order
      },
      take: limit,
      select: {
        user: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            nftPurchaseEvents: {
              distinct: ['builderNftId']
            }
          }
        },
        pointsEarnedAsScout: true,
        nftsPurchased: true
      }
    });

    const sortedBuilders = builders.map((builder) => ({
      path: builder.user.path,
      avatar: builder.user.avatar as string,
      displayName: builder.user.displayName,
      rank: rankMap.get(builder.user.path) || 0,
      points: builder.pointsEarnedAsScout || 0,
      cards: builder.nftsPurchased || 0,
      builders: builder.user.nftPurchaseEvents.length
    }));

    if (sortBy === 'cards') {
      return sortedBuilders;
    } else if (sortBy === 'builders') {
      return sortedBuilders.sort((a, b) => {
        if (order === 'asc') {
          return a.builders - b.builders;
        } else {
          return b.builders - a.builders;
        }
      });
    }
  }

  log.error(`Invalid sortBy provided: ${sortBy}`);
  return [];
}

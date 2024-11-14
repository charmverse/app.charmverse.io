import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason, getCurrentWeek, getLastWeek } from '../dates';
import { BasicUserInfoSelect } from '../users/queries';

import type { BuilderInfo } from './interfaces';

export type Last7DaysGems = { date: string; gemsCount: number }[];

const userSelect = {
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
  builderCardActivities: {
    select: {
      last7Days: true
    }
  },
  userWeeklyStats: {
    where: {
      week: getCurrentWeek()
    },
    select: {
      gemsCollected: true,
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
};

export async function getTodaysHotBuilders(): Promise<BuilderInfo[]> {
  const currentWeekBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      user: {
        builderStatus: 'approved',
        userWeeklyStats: {
          some: {
            week: getCurrentWeek(),
            gemsCollected: {
              gt: 0
            }
          }
        }
      },
      week: getCurrentWeek()
    },
    take: 3,
    orderBy: {
      rank: 'asc'
    },
    select: {
      user: {
        select: userSelect
      }
    }
  });

  const totalCurrentWeekBuilders = currentWeekBuilders.length;

  const previousWeekBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      user: {
        id: {
          notIn: currentWeekBuilders.map((builder) => builder.user.id)
        },
        builderStatus: 'approved'
      },
      week: getLastWeek()
    },
    orderBy: {
      rank: 'asc'
    },
    take: 10 - totalCurrentWeekBuilders,
    select: {
      user: {
        select: userSelect
      }
    }
  });

  const builders = [
    ...currentWeekBuilders.map((builder) => builder.user),
    ...previousWeekBuilders.map((builder) => builder.user)
  ];

  return builders.map((builder) => {
    return {
      id: builder.id,
      path: builder.path,
      displayName: builder.displayName,
      builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      price: builder.builderNfts[0]?.currentPrice ?? 0,
      nftImageUrl: builder.builderNfts[0]?.imageUrl,
      nftsSold: builder.userSeasonStats[0]?.nftsSold || 0,
      builderStatus: builder.builderStatus!,
      rank: builder.userWeeklyStats[0]?.rank || -1,
      last7DaysGems: ((builder.builderCardActivities[0]?.last7Days as unknown as Last7DaysGems) || [])
        .map((gem) => gem.gemsCount)
        .slice(-7)
    };
  });
}

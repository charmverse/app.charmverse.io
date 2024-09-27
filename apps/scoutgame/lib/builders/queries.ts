import type { Prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

export const seasonQualifiedBuilderWhere: Prisma.UserSeasonStatsWhereInput = {
  season: currentSeason,
  user: {
    builderStatus: 'approved',
    builderNfts: {
      some: {
        season: currentSeason,
        nftSoldEvents: {
          some: {}
        }
      }
    }
  }
};

export const weeklyQualifiedBuilderWhere: Prisma.UserWeeklyStatsWhereInput = {
  week: getCurrentWeek(),
  user: {
    builderStatus: 'approved',
    builderNfts: {
      some: {
        season: currentSeason,
        nftSoldEvents: {
          some: {}
        }
      }
    }
  }
};

import type { Prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';

export const seasonQualifiedBuilderWhere: Prisma.UserSeasonStatsWhereInput = {
  season: currentSeason,
  user: {
    bannedAt: null,
    builder: true,
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
    bannedAt: null,
    builder: true,
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

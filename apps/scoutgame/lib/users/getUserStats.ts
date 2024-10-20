import type { UserAllTimeStats, UserSeasonStats } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export type UserStats = {
  githubLogin?: string;
  seasonPoints?: Pick<UserSeasonStats, 'pointsEarnedAsBuilder' | 'pointsEarnedAsScout'>;
  allTimePoints?: Pick<UserAllTimeStats, 'pointsEarnedAsBuilder' | 'pointsEarnedAsScout'>;
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const currentUser = await prisma.scout.findUnique({
    where: {
      id: userId
    },
    select: {
      githubUser: {
        select: {
          login: true
        }
      },
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsBuilder: true,
          pointsEarnedAsScout: true
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true,
          pointsEarnedAsScout: true
        }
      }
    }
  });

  const githubUser = currentUser?.githubUser[0];
  const seasonPoints = currentUser?.userSeasonStats[0];
  const allTimePoints = currentUser?.userAllTimeStats[0];

  return {
    githubLogin: githubUser?.login,
    seasonPoints,
    allTimePoints
  };
}

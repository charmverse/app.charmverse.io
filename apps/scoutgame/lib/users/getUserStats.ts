import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

export type UserStats = {
  githubLogin?: string;
  seasonPoints: {
    builderPoints?: number;
    scoutPoints?: number;
  };
  allTimePoints: {
    builderPoints?: number;
    scoutPoints?: number;
  };
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
    seasonPoints: {
      builderPoints: seasonPoints?.pointsEarnedAsBuilder,
      scoutPoints: seasonPoints?.pointsEarnedAsScout
    },
    allTimePoints: {
      builderPoints: allTimePoints?.pointsEarnedAsBuilder,
      scoutPoints: allTimePoints?.pointsEarnedAsScout
    }
  };
}

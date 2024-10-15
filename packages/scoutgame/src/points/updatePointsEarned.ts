import type { PrismaTransactionClient, UserAllTimeStats, UserSeasonStats } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Increments points by specific amount
 * @info Use setPointsEarnedStats to set points to a specific value
 * */
export async function incrementPointsEarnedStats({
  season,
  userId,
  builderPoints = 0,
  scoutPoints = 0,
  tx = prisma
}: {
  season: string;
  userId: string;
  builderPoints?: number;
  scoutPoints?: number;
  tx?: PrismaTransactionClient;
}) {
  await tx.userSeasonStats.upsert({
    where: {
      userId_season: {
        userId,
        season
      }
    },
    create: {
      pointsEarnedAsBuilder: builderPoints,
      pointsEarnedAsScout: scoutPoints,
      season,
      user: {
        connect: {
          id: userId
        }
      }
    },
    update: {
      pointsEarnedAsBuilder: {
        increment: builderPoints
      },
      pointsEarnedAsScout: {
        increment: scoutPoints
      }
    }
  });
  await tx.userAllTimeStats.upsert({
    where: {
      userId
    },
    create: {
      pointsEarnedAsBuilder: builderPoints,
      pointsEarnedAsScout: scoutPoints,
      user: {
        connect: {
          id: userId
        }
      }
    },
    update: {
      pointsEarnedAsBuilder: {
        increment: builderPoints
      },
      pointsEarnedAsScout: {
        increment: scoutPoints
      }
    }
  });
}

export async function setPointsEarnedStats({
  season,
  userId,
  builderPoints,
  scoutPoints,
  tx = prisma
}: {
  season: string;
  userId: string;
  builderPoints: number;
  scoutPoints: number;
  tx?: PrismaTransactionClient;
}): Promise<{ seasonStats: UserSeasonStats; allTimeStats: UserAllTimeStats }> {
  async function txHandler(_tx: PrismaTransactionClient) {
    const seasonStats = await _tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId,
          season
        }
      },
      create: {
        pointsEarnedAsBuilder: builderPoints,
        pointsEarnedAsScout: scoutPoints,
        season,
        user: {
          connect: {
            id: userId
          }
        }
      },
      update: {
        pointsEarnedAsBuilder: builderPoints,
        pointsEarnedAsScout: scoutPoints
      }
    });
    const allTimeStats = await _tx.userAllTimeStats.upsert({
      where: {
        userId
      },
      create: {
        pointsEarnedAsBuilder: builderPoints,
        pointsEarnedAsScout: scoutPoints,
        user: {
          connect: {
            id: userId
          }
        }
      },
      update: {
        pointsEarnedAsBuilder: builderPoints,
        pointsEarnedAsScout: scoutPoints
      }
    });

    return {
      seasonStats,
      allTimeStats
    };
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}

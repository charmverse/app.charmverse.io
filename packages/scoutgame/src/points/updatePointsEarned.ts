import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

// returns a list of promises to pass to prisma.transaction
export async function updatePointsEarned({
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

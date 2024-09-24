import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

export async function claimPoints(userId: string) {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        season: currentSeason
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          type: true,
          builderId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  let builderPoints = 0;
  let scoutPoints = 0;

  for (const receipt of pointsReceipts) {
    const points = receipt.value;
    if (receipt.event.type === 'nft_purchase') {
      builderPoints += points;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        scoutPoints += points;
      } else {
        builderPoints += points;
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.pointsReceipt.updateMany({
      where: {
        recipientId: userId,
        claimedAt: null,
        event: {
          season: currentSeason
        }
      },
      data: {
        claimedAt: new Date()
      }
    });
    await prisma.scout.update({
      where: {
        id: userId
      },
      data: {
        currentBalance: {
          increment: builderPoints + scoutPoints
        }
      }
    });
    await prisma.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId,
          season: currentSeason
        }
      },
      create: {
        pointsEarnedAsBuilder: builderPoints,
        pointsEarnedAsScout: scoutPoints,
        season: currentSeason,
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
    await prisma.userAllTimeStats.upsert({
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
  });
}

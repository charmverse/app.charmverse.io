import assert from 'node:assert';

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { validate as isUuid } from 'uuid';

import { currentSeason } from '../dates';

import { setPointsEarnedStats } from './updatePointsEarned';

export type PointStats = {
  userId: string;
  pointsReceivedAsScout: number;
  pointsReceivedAsBuilder: number;
  bonusPointsReceived: number;
  pointsSpent: number;
  balance: number;
};

const include: Prisma.PointsReceiptInclude = {
  event: true,
  activities: true
};

export async function getPointStatsFromHistory({
  userIdOrUsername,
  tx = prisma
}: {
  userIdOrUsername: string;
  tx?: Prisma.TransactionClient;
}): Promise<PointStats> {
  if (!userIdOrUsername) {
    throw new InvalidInputError('userIdOrUsername is required');
  }

  const userId = isUuid(userIdOrUsername)
    ? userIdOrUsername
    : await tx.scout
        .findUniqueOrThrow({
          where: {
            username: userIdOrUsername
          }
        })
        .then((user) => user.id);

  const [
    pointsSpentRecords,
    pointsReceivedAsBuilderRecords,
    pointsReceivedAsScoutRecords,
    bonusPointsReceivedRecords,
    allPointsReceivedRecords
  ] = await Promise.all([
    // Points spent
    tx.pointsReceipt.findMany({
      where: {
        senderId: userId
      }
    }),
    // Points received as builder
    tx.pointsReceipt.findMany({
      where: {
        recipientId: userId,
        OR: [
          {
            event: {
              type: 'gems_payout'
            },
            activities: {
              some: {
                userId,
                recipientType: 'builder'
              }
            }
          },
          {
            event: {
              type: 'nft_purchase',
              builderId: userId
            }
          }
        ]
      },
      include
    }),
    // Points received as scout
    tx.pointsReceipt.findMany({
      where: {
        recipientId: userId,
        OR: [
          {
            event: {
              type: 'gems_payout'
            },
            activities: {
              some: {
                userId,
                recipientType: 'scout'
              }
            }
          }
        ]
      },
      include
    }),
    // Bonus points received
    tx.pointsReceipt.findMany({
      where: {
        recipientId: userId,
        OR: [
          {
            event: {
              type: 'misc_event'
            },
            activities: {
              some: {
                userId,
                recipientType: 'builder'
              }
            }
          },
          {
            event: {
              type: 'misc_event'
            },
            activities: {
              some: {
                userId,
                recipientType: 'scout'
              }
            }
          },
          {
            event: {
              type: 'misc_event'
            },
            activities: {
              none: {}
            }
          }
        ]
      }
    }),
    // All points received
    tx.pointsReceipt.findMany({
      where: {
        recipientId: userId
      },
      include
    })
  ]);

  const pointsSpent = pointsSpentRecords.reduce((acc, { value }) => acc + value, 0);

  const pointsReceivedAsBuilder = pointsReceivedAsBuilderRecords.reduce((acc, { value }) => acc + value, 0);
  const pointsReceivedAsScout = pointsReceivedAsScoutRecords.reduce((acc, { value }) => acc + value, 0);
  const bonusPointsReceived = bonusPointsReceivedRecords.reduce((acc, { value }) => acc + value, 0);

  const allPointsReceived = allPointsReceivedRecords.reduce((acc, { value }) => acc + value, 0);

  const allPointsReceivedSum = pointsReceivedAsBuilder + pointsReceivedAsScout + bonusPointsReceived;

  const balance = allPointsReceived - pointsSpent;

  const missingPointRecords = allPointsReceivedRecords.filter(
    (record) =>
      !pointsReceivedAsBuilderRecords.some((r) => r.id === record.id) &&
      !pointsReceivedAsScoutRecords.some((r) => r.id === record.id)
  );

  assert.equal(allPointsReceived, allPointsReceivedSum);

  return {
    balance,
    pointsReceivedAsBuilder,
    pointsReceivedAsScout,
    bonusPointsReceived,
    pointsSpent,
    userId
  };
}

export async function refreshPointStatsFromHistory({
  userIdOrUsername,
  season = currentSeason,
  tx
}: {
  userIdOrUsername: string;
  season?: string;
  tx?: Prisma.TransactionClient;
}): Promise<PointStats> {
  async function txHandler(_tx: Prisma.TransactionClient) {
    const stats = await getPointStatsFromHistory({ userIdOrUsername, tx: _tx });

    await setPointsEarnedStats({
      season,
      builderPoints: stats.pointsReceivedAsBuilder,
      scoutPoints: stats.pointsReceivedAsScout,
      userId: stats.userId,
      tx: _tx
    });

    await _tx.scout.update({
      where: {
        id: stats.userId
      },
      data: {
        currentBalance: stats.balance
      }
    });

    return stats;
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}

async function fixPoints() {
  const scouts = await prisma.scout.findMany({
    select: { id: true, username: true },
    orderBy: {
      id: 'asc'
    },
    where: {
      createdAt: {
        lte: new Date('2024-10-14')
      }
    }
  });

  for (let i = 0; i < scouts.length; i++) {
    const scout = scouts[i];
    try {
      log.info(`Fixing points for ${scout.username} ${i + 1} / ${scouts.length}`);
      const stats = await refreshPointStatsFromHistory({ userIdOrUsername: scout.id });
      log.info(`Successfully fixed points for ${scout.username}. New balance: ${stats.balance}`);
    } catch (error) {
      log.error(`Failed to fix points for ${scout.username}: ${prettyPrint(error)}`);
    }
  }
}

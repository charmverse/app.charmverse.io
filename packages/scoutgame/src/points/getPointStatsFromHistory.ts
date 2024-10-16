import assert from 'node:assert';

import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { validate as isUuid } from 'uuid';

export type PointStats = {
  userId: string;
  pointsReceivedAsScout: number;
  pointsReceivedAsBuilder: number;
  bonusPointsReceived: number;
  pointsSpent: number;
  claimedPoints: number;
  unclaimedPoints: number;
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

  const userId = await tx.scout
    .findUniqueOrThrow({
      where: isUuid(userIdOrUsername) ? { id: userIdOrUsername } : { username: userIdOrUsername },
      select: {
        id: true
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

  const claimedPoints = allPointsReceivedRecords
    .filter((record) => !!record.claimedAt)
    .reduce((acc, { value }) => acc + value, 0);

  const unclaimedPoints = allPointsReceivedRecords
    .filter((record) => !record.claimedAt)
    .reduce((acc, { value }) => acc + value, 0);

  const balance = claimedPoints - pointsSpent;

  const missingPointRecords = allPointsReceivedRecords.filter(
    (record) =>
      !pointsReceivedAsBuilderRecords.some((r) => r.id === record.id) &&
      !pointsReceivedAsScoutRecords.some((r) => r.id === record.id)
  );

  assert.equal(allPointsReceived, allPointsReceivedSum);

  return {
    balance,
    claimedPoints,
    unclaimedPoints,
    pointsReceivedAsBuilder,
    pointsReceivedAsScout,
    bonusPointsReceived,
    pointsSpent,
    userId
  };
}

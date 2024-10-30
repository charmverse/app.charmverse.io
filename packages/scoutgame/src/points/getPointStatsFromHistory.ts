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
  userIdOrPath,
  tx = prisma
}: {
  userIdOrPath: string;
  tx?: Prisma.TransactionClient;
}): Promise<PointStats> {
  if (!userIdOrPath) {
    throw new InvalidInputError('userIdOrPath is required');
  }

  const userId = await tx.scout
    .findUniqueOrThrow({
      where: isUuid(userIdOrPath) ? { id: userIdOrPath } : { path: userIdOrPath },
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
              builderId: userId,
              type: 'gems_payout'
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
              builderId: {
                not: userId
              },
              type: 'gems_payout'
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
        event: {
          builderId: userId,
          type: 'misc_event'
        }
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
      !pointsReceivedAsScoutRecords.some((r) => r.id === record.id) &&
      !bonusPointsReceivedRecords.some((r) => r.id === record.id)
  );

  // console.log(missingPointRecords);

  assert.equal(
    allPointsReceived,
    allPointsReceivedSum,
    `All points received sum does not match for scout id: ${userId}`
  );

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

import assert from 'node:assert';

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { validate as isUuid } from 'uuid';

import { currentSeason } from '../dates';

import { setPointsEarned } from './updatePointsEarned';

export type PointStats = {
  userId: string;
  pointsReceivedAsScout: number;
  pointsReceivedAsBuilder: number;
  pointsSpent: number;
  balance: number;
};

const include: Prisma.PointsReceiptInclude = {
  event: true,
  activities: true
};

export async function getPointStatsFromHistory({
  userIdOrUsername,
  season = currentSeason
}: {
  userIdOrUsername: string;
  season?: string;
}): Promise<PointStats> {
  if (!userIdOrUsername) {
    throw new InvalidInputError('userIdOrUsername is required');
  }

  const userId = isUuid(userIdOrUsername)
    ? userIdOrUsername
    : await prisma.scout
        .findUniqueOrThrow({
          where: {
            username: userIdOrUsername
          }
        })
        .then((user) => user.id);

  const [pointsSpentRecords, pointsReceivedAsBuilderRecords, pointsReceivedAsScoutRecords, allPointsReceivedRecords] =
    await Promise.all([
      // Points spent
      prisma.pointsReceipt.findMany({
        where: {
          senderId: userId,
          event: {
            season
          }
        }
      }),
      // Points received as builder
      prisma.pointsReceipt.findMany({
        where: {
          recipientId: userId,
          OR: [
            {
              event: {
                season,
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
                season,
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
                season,
                type: 'nft_purchase',
                builderId: userId
              }
            }
          ]
        },
        include
      }),
      // Points received as scout
      prisma.pointsReceipt.findMany({
        where: {
          recipientId: userId,
          OR: [
            {
              event: {
                season,
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
                season,
                type: 'misc_event'
              },
              activities: {
                none: {}
              }
            },
            {
              event: {
                season,
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
      // All points received
      prisma.pointsReceipt.findMany({
        where: {
          recipientId: userId
        },
        include
      })
    ]);

  const pointsSpent = pointsSpentRecords.reduce((acc, { value }) => acc + value, 0);

  const pointsReceivedAsBuilder = pointsReceivedAsBuilderRecords.reduce((acc, { value }) => acc + value, 0);
  const pointsReceivedAsScout = pointsReceivedAsScoutRecords.reduce((acc, { value }) => acc + value, 0);

  const allPointsReceived = allPointsReceivedRecords.reduce((acc, { value }) => acc + value, 0);

  const balance = pointsReceivedAsBuilder + pointsReceivedAsScout - pointsSpent;

  const missingPointRecords = allPointsReceivedRecords.filter(
    (record) =>
      !pointsReceivedAsBuilderRecords.some((r) => r.id === record.id) &&
      !pointsReceivedAsScoutRecords.some((r) => r.id === record.id)
  );

  assert.equal(allPointsReceived, pointsReceivedAsBuilder + pointsReceivedAsScout);

  return {
    balance,
    pointsReceivedAsBuilder,
    pointsReceivedAsScout,
    pointsSpent,
    userId
  };
}

export async function refreshPointStatsFromHistory({
  userIdOrUsername,
  season = currentSeason
}: {
  userIdOrUsername: string;
  season?: string;
}) {
  const stats = await getPointStatsFromHistory({ userIdOrUsername, season });

  await setPointsEarned({
    season,
    builderPoints: stats.pointsReceivedAsBuilder,
    scoutPoints: stats.pointsReceivedAsScout,
    userId: stats.userId
  });

  await prisma.scout.update({
    where: {
      id: stats.userId
    },
    data: {
      currentBalance: stats.balance
    }
  });

  return stats;
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

// fixPoints().then(console.log);

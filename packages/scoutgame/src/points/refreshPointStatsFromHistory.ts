import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { validate as isUuid } from 'uuid';

import { currentSeason } from '../dates';

import { updatePointsEarned } from './updatePointsEarned';

export type PointStats = {
  userId: string;
  pointsReceivedAsScout: number;
  pointsReceivedAsBuilder: number;
  pointsSpent: number;
  balance: number;
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

  const pointsSpent = await prisma.pointsReceipt
    .findMany({
      where: {
        senderId: userId,
        event: {
          season
        }
      }
    })
    .then((points) => points.reduce((acc, { value }) => acc + value, 0));

  const pointsReceivedAsBuilder = await prisma.pointsReceipt
    .findMany({
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
              type: 'nft_purchase',
              builderId: userId
            }
          }
        ]
      }
    })
    .then((points) => points.reduce((acc, { value }) => acc + value, 0));

  const pointsReceivedAsScout = await prisma.pointsReceipt
    .findMany({
      where: {
        recipientId: userId,
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
    })
    .then((points) => points.reduce((acc, { value }) => acc + value, 0));

  const balance = pointsReceivedAsBuilder + pointsReceivedAsScout - pointsSpent;

  const allPoints = await prisma.pointsReceipt
    .findMany({
      where: {
        recipientId: userId
      }
    })
    .then((points) => points.reduce((acc, { value }) => acc + value, 0));

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
  season = currentSeason,
  freePoints = 0
}: {
  userIdOrUsername: string;
  season?: string;
  freePoints?: number;
}) {
  const stats = await getPointStatsFromHistory({ userIdOrUsername, season });

  await updatePointsEarned({
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
      currentBalance: stats.balance + freePoints
    }
  });
}

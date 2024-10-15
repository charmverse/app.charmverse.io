import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/scoutgame/dates';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { incrementPointsEarnedStats } from './updatePointsEarned';

export async function sendPoints({
  builderId,
  season = currentSeason,
  week = getCurrentWeek(),
  points,
  description,
  earnedAsBuilder = false,
  claimed,
  hideFromNotifications = false,
  tx
}: {
  builderId: string;
  points: number;
  season?: ISOWeek;
  week?: ISOWeek;
  description: string;
  claimed: boolean;
  earnedAsBuilder?: boolean;
  hideFromNotifications?: boolean;
  tx?: Prisma.TransactionClient;
}) {
  async function txHandler(_tx: Prisma.TransactionClient) {
    await _tx.builderEvent.create({
      data: {
        builderId,
        type: 'misc_event',
        week,
        season,
        description,
        pointsReceipts: {
          create: {
            claimedAt: claimed ? new Date() : null,
            value: points,
            recipientId: builderId,
            activities: hideFromNotifications
              ? undefined
              : {
                  create: {
                    type: 'points',
                    userId: builderId,
                    recipientType: earnedAsBuilder ? 'builder' : 'scout'
                  }
                }
          }
        }
      }
    });
    await _tx.scout.update({
      where: {
        id: builderId
      },
      data: {
        currentBalance: {
          increment: points
        }
      }
    });
    await incrementPointsEarnedStats({
      season,
      userId: builderId,
      builderPoints: earnedAsBuilder ? points : 0,
      scoutPoints: !earnedAsBuilder ? points : 0,
      tx: _tx
    });
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}

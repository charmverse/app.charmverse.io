import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/scoutgame/dates';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { incrementPointsEarned } from './updatePointsEarned';

export async function sendPoints({
  builderId,
  season = currentSeason,
  week = getCurrentWeek(),
  points,
  description = 'Bonus points',
  earnedAsBuilder = false,
  claimed = true,
  hideFromNotifications = false
}: {
  builderId: string;
  points: number;
  season?: ISOWeek;
  week?: ISOWeek;
  description?: string;
  claimed?: boolean;
  earnedAsBuilder?: boolean;
  hideFromNotifications?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.builderEvent.create({
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
    await tx.scout.update({
      where: {
        id: builderId
      },
      data: {
        currentBalance: {
          increment: points
        }
      }
    });
    await incrementPointsEarned({
      season,
      userId: builderId,
      builderPoints: earnedAsBuilder ? points : 0,
      scoutPoints: !earnedAsBuilder ? points : 0,
      tx
    });
  });
}

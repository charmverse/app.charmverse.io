import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ISOWeek } from '../../dates';
import { currentSeason, getCurrentWeek } from '../../dates';
import { incrementPointsEarnedStats } from '../updatePointsEarned';

export async function sendPointsForDailyClaim({
  builderId,
  season = currentSeason,
  week = getCurrentWeek(),
  points,
  dayOfWeek,
  tx
}: {
  dayOfWeek: number;
  builderId: string;
  points: number;
  season?: ISOWeek;
  week?: ISOWeek;
  tx?: Prisma.TransactionClient;
}) {
  async function txHandler(_tx: Prisma.TransactionClient) {
    await _tx.scoutDailyClaimEvent.create({
      data: {
        dayOfWeek,
        week,
        user: {
          connect: {
            id: builderId
          }
        },
        event: {
          create: {
            builderId,
            type: 'daily_claim',
            week,
            season,
            pointsReceipts: {
              create: {
                claimedAt: new Date(),
                value: points,
                recipientId: builderId,
                activities: {
                  create: {
                    type: 'points',
                    userId: builderId,
                    recipientType: 'builder'
                  }
                }
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
      builderPoints: points,
      tx: _tx
    });
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}

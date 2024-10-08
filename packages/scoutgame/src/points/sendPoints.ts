import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/scoutgame/dates';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

export async function sendPoints({
  builderId,
  season = currentSeason,
  week = getCurrentWeek(),
  points,
  earnedAsBuilder = false,
  hideFromNotifications = false
}: {
  builderId: string;
  points: number;
  season?: ISOWeek;
  week?: ISOWeek;
  earnedAsBuilder?: boolean;
  hideFromNotifications?: boolean;
}) {
  return prisma.$transaction([
    prisma.builderEvent.create({
      data: {
        builderId,
        type: 'misc_event',
        week,
        season,
        description: 'Received points for participating in pre-season week as a Builder',
        pointsReceipts: {
          create: {
            claimedAt: new Date(),
            value: points,
            recipientId: builderId,
            activities: hideFromNotifications
              ? undefined
              : {
                  create: {
                    type: 'points',
                    userId: builderId,
                    recipientType: 'builder'
                  }
                }
          }
        }
      }
    }),
    prisma.scout.update({
      where: {
        id: builderId
      },
      data: {
        currentBalance: {
          increment: 100
        }
      }
    }),
    ...(earnedAsBuilder
      ? [
          prisma.userSeasonStats.upsert({
            where: {
              userId_season: {
                userId: builderId,
                season
              }
            },
            update: {
              pointsEarnedAsBuilder: {
                increment: points
              }
            },
            create: {
              userId: builderId,
              season,
              pointsEarnedAsBuilder: points,
              pointsEarnedAsScout: 0
            }
          })
        ]
      : [])
  ]);
}

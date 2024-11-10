import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
import { dividePointsBetweenBuilderAndScouts } from '@packages/scoutgame/points/dividePointsBetweenBuilderAndScouts';
import { incrementPointsEarnedStats } from '@packages/scoutgame/points/updatePointsEarned';
import { v4 } from 'uuid';

export async function processScoutPointsPayout({
  builderId,
  rank,
  gemsCollected,
  week,
  season,
  createdAt,
  normalisationFactor = 1,
  weeklyAllocatedPoints
}: {
  builderId: string;
  rank: number;
  gemsCollected: number;
  week: string;
  season: string;
  createdAt?: Date;
  normalisationFactor?: number;
  weeklyAllocatedPoints: number;
}) {
  const existingGemsPayoutEvent = await prisma.gemsPayoutEvent.findUnique({
    where: {
      builderId_week: {
        builderId,
        week
      }
    }
  });

  if (existingGemsPayoutEvent) {
    log.warn(`Gems payout event already exists for builder in week ${week}`, { userId: builderId });
    return;
  }

  const { pointsForBuilder, pointsPerScout, totalNftsPurchased } = await dividePointsBetweenBuilderAndScouts({
    builderId,
    season,
    rank,
    weeklyAllocatedPoints,
    normalisationFactor
  });

  if (totalNftsPurchased === 0) {
    log.warn(`No NFTs purchased for builder in week ${week}`, { userId: builderId });
    return;
  }

  const earnableScoutPoints = Math.floor(
    calculateEarnableScoutPointsForRank({ rank, weeklyAllocatedPoints }) * normalisationFactor
  );

  return prisma.$transaction(
    async (tx) => {
      const builderEventId = v4();

      await tx.gemsPayoutEvent.create({
        data: {
          gems: gemsCollected,
          points: earnableScoutPoints,
          week,
          season,
          builderId,
          builderEvent: {
            create: {
              id: builderEventId,
              type: 'gems_payout',
              season,
              week,
              builderId,
              createdAt
            }
          }
        }
      });

      await Promise.all([
        ...pointsPerScout.map(async ({ scoutId, scoutPoints }) => {
          await tx.pointsReceipt.create({
            data: {
              value: scoutPoints,
              recipientId: scoutId,
              eventId: builderEventId,
              activities: {
                create: {
                  recipientType: 'scout',
                  type: 'points',
                  userId: scoutId,
                  createdAt
                }
              }
            }
          });
          await incrementPointsEarnedStats({
            userId: scoutId,
            season,
            scoutPoints,
            tx
          });
        }),
        tx.pointsReceipt.create({
          data: {
            value: pointsForBuilder,
            recipientId: builderId,
            eventId: builderEventId,
            activities: {
              create: {
                recipientType: 'builder',
                type: 'points',
                userId: builderId,
                createdAt
              }
            }
          }
        }),
        incrementPointsEarnedStats({
          userId: builderId,
          season,
          builderPoints: pointsForBuilder,
          tx
        })
      ]);
    },
    {
      timeout: 100000
    }
  );
}

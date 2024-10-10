import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
import { updatePointsEarned } from '@packages/scoutgame/points/updatePointsEarned';
import { v4 } from 'uuid';

export async function processScoutPointsPayout({
  builderId,
  rank,
  gemsCollected,
  week,
  season,
  createdAt
}: {
  builderId: string;
  rank: number;
  gemsCollected: number;
  week: string;
  season: string;
  createdAt?: Date;
}) {
  const nftHolders = await prisma.nFTPurchaseEvent.groupBy({
    by: ['scoutId'],
    where: {
      builderNFT: {
        season,
        builderId
      }
    },
    _count: {
      scoutId: true
    }
  });

  const totalNftsPurchased = nftHolders.reduce((acc, { _count: { scoutId: count } }) => acc + count, 0);

  if (totalNftsPurchased === 0) {
    return;
  }

  const earnableScoutPoints = calculateEarnableScoutPointsForRank(rank);

  const existingGemsPayoutEvent = await prisma.gemsPayoutEvent.findUnique({
    where: {
      builderId_week: {
        builderId,
        week
      }
    }
  });

  if (existingGemsPayoutEvent) {
    return;
  }

  return prisma.$transaction(async (tx) => {
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

    const builderPoints = Math.floor(0.2 * earnableScoutPoints);
    await Promise.all([
      ...nftHolders.map(async ({ scoutId, _count: { scoutId: nftsPurchased } }) => {
        const scoutPoints = Math.floor(0.8 * earnableScoutPoints * (nftsPurchased / totalNftsPurchased));
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
        await updatePointsEarned({
          userId: scoutId,
          season,
          scoutPoints,
          tx
        });
      }),
      tx.pointsReceipt.create({
        data: {
          value: builderPoints,
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
      updatePointsEarned({
        userId: builderId,
        season,
        builderPoints,
        tx
      })
    ]);
  });
}

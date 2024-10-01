import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/calculatePoints';
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

  await prisma.$transaction(async (tx) => {
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
      nftHolders.map(({ scoutId, _count: { scoutId: nftsPurchased } }) =>
        tx.pointsReceipt.create({
          data: {
            value: 0.8 * earnableScoutPoints * (nftsPurchased / totalNftsPurchased),
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
        })
      ),
      tx.pointsReceipt.create({
        data: {
          value: 0.2 * earnableScoutPoints,
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
      })
    ]);
  });
}

import { prisma } from '@charmverse/core/prisma-client';
import { builderPointsShare, scoutPointsShare } from '@packages/scoutgame/builderNfts/constants';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
import { updatePointsEarned } from '@packages/scoutgame/points/updatePointsEarned';
import { v4 } from 'uuid';

export async function processScoutPointsPayout({
  builderId,
  rank,
  gemsCollected,
  week,
  season,
  createdAt,
  normalisationFactor = 1
}: {
  builderId: string;
  rank: number;
  gemsCollected: number;
  week: string;
  season: string;
  createdAt?: Date;
  normalisationFactor?: number;
}) {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season,
        builderId
      }
    }
  });

  const { totalNftsPurchased, nftsByScout } = nftPurchaseEvents.reduce(
    (acc, purchaseEvent) => {
      acc.totalNftsPurchased += purchaseEvent.tokensPurchased;
      acc.nftsByScout[purchaseEvent.scoutId] =
        (acc.nftsByScout[purchaseEvent.scoutId] || 0) + purchaseEvent.tokensPurchased;
      return acc;
    },
    {
      totalNftsPurchased: 0,
      nftsByScout: {} as Record<string, number>
    }
  );

  if (totalNftsPurchased === 0) {
    return;
  }

  const earnableScoutPoints = Math.floor(calculateEarnableScoutPointsForRank(rank) * normalisationFactor);

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

      const builderPoints = Math.floor(builderPointsShare * earnableScoutPoints);
      await Promise.all([
        ...Object.entries(nftsByScout).map(async ([scoutId, tokensPurchased]) => {
          const scoutPoints = Math.floor(
            scoutPointsShare * earnableScoutPoints * (tokensPurchased / totalNftsPurchased)
          );
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
    },
    {
      timeout: 100000
    }
  );
}

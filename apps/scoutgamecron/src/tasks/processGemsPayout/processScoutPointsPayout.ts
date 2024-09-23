import { prisma } from '@charmverse/core/prisma-client';
import { calculatePointsForRank } from '@packages/scoutgame/calculatePoints';
import { currentSeason } from '@packages/scoutgame/utils';

export async function processScoutPointsPayout({
  builderId,
  rank,
  gemsCollected,
  week
}: {
  builderId: string;
  rank: number;
  gemsCollected: number;
  week: string;
}) {
  const nftHolders = await prisma.nFTPurchaseEvent.groupBy({
    by: ['scoutId'],
    where: {
      builderId
    },
    _count: {
      scoutId: true
    }
  });

  const totalNftsPurchased = nftHolders.reduce((acc, { _count: { scoutId: count } }) => acc + count, 0);

  if (totalNftsPurchased === 0) {
    return;
  }

  const calculatedPoints = calculatePointsForRank(rank);

  await prisma.gemsPayoutEvent.upsert({
    where: {
      builderId_week: {
        builderId,
        week
      }
    },
    create: {
      gems: gemsCollected,
      points: calculatedPoints,
      week,
      builderId,
      builderEvent: {
        create: {
          type: 'gems_payout',
          season: currentSeason,
          week,
          builderId,
          pointsReceipts: {
            createMany: {
              data: [
                ...nftHolders.map(({ scoutId, _count: { scoutId: nftsPurchased } }) => ({
                  value: 0.8 * calculatedPoints * (nftsPurchased / totalNftsPurchased),
                  recipientId: scoutId
                })),
                {
                  value: 0.2 * calculatedPoints,
                  recipientId: builderId
                }
              ]
            }
          }
        }
      }
    },
    update: {}
  });
}

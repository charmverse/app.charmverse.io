import { prisma } from '@charmverse/core/prisma-client';
import { calculatePointsForRank, getTopBuilders } from '@packages/scoutgame/calculatePoints';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';

export async function processGemsPayout() {
  const topBuilders = await getTopBuilders(100);
  const week = getCurrentWeek();

  for (const { builder, gemsCollected, rank } of topBuilders) {
    const nftHolders = await prisma.nFTPurchaseEvent.groupBy({
      by: ['scoutId'],
      where: {
        builderId: builder.id
      },
      _count: {
        scoutId: true
      }
    });

    const totalNftsPurchased = nftHolders.reduce((acc, { _count: { scoutId: count } }) => acc + count, 0);
    const calculatedPoints = calculatePointsForRank(rank);

    await prisma.gemsPayoutEvent.create({
      data: {
        gems: gemsCollected,
        points: calculatedPoints,
        week,
        builderId: builder.id,
        builderEvent: {
          create: {
            type: 'gems_payout',
            season: currentSeason,
            week,
            builderId: builder.id,
            pointsReceipts: {
              createMany: {
                data: [
                  ...nftHolders.map(({ scoutId, _count: { scoutId: nftsPurchased } }) => ({
                    value: 0.8 * calculatedPoints * (nftsPurchased / totalNftsPurchased),
                    recipientId: scoutId
                  })),
                  {
                    value: 0.2 * calculatedPoints,
                    recipientId: builder.id
                  }
                ]
              }
            }
          }
        }
      }
    });
  }
}

import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/calculatePoints';
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
      builderNFT: {
        season: currentSeason,
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

  await prisma.gemsPayoutEvent.upsert({
    where: {
      builderId_week: {
        builderId,
        week
      }
    },
    create: {
      gems: gemsCollected,
      points: earnableScoutPoints,
      week,
      season: currentSeason,
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
                  value: 0.8 * earnableScoutPoints * (nftsPurchased / totalNftsPurchased),
                  recipientId: scoutId
                })),
                {
                  value: 0.2 * earnableScoutPoints,
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

import { prisma } from '@charmverse/core/prisma-client';
import { calculatePointsForRank, getTopBuilders } from '@packages/scoutgame/calculatePoints';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';

export async function processGemsPayout() {
  const topBuilders = await getTopBuilders(100);
  const week = getCurrentWeek();

  for (const { builder, gemsCollected, rank } of topBuilders) {
    const calculatedPoints = calculatePointsForRank(rank);
    await prisma.gemsPayoutEvent.create({
      data: {
        gems: gemsCollected,
        points: calculatedPoints,
        week,
        builderId: builder.id
      }
    });

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

    for (const {
      scoutId,
      _count: { scoutId: count }
    } of nftHolders) {
      const scoutPoints = 0.8 * calculatedPoints * (count / totalNftsPurchased);
      await prisma.$transaction([
        prisma.pointsReceipt.create({
          data: {
            value: scoutPoints,
            recipientId: scoutId,
            // Why is the eventId a builder event
            eventId: '',
            // Who would be the sender here?
            senderId: '',
            // Why is claimedAt always required?
            claimedAt: new Date()
          }
        }),
        prisma.userSeasonStats.upsert({
          where: {
            userId_season: {
              userId: scoutId,
              season: currentSeason
            }
          },
          update: {
            pointsEarnedAsScout: {
              increment: scoutPoints
            }
          },
          create: {
            pointsEarnedAsScout: scoutPoints,
            userId: scoutId,
            season: currentSeason,
            pointsEarnedAsBuilder: 0
          }
        }),
        prisma.userAllTimeStats.upsert({
          where: {
            userId: scoutId
          },
          update: {
            pointsEarnedAsScout: {
              increment: scoutPoints
            }
          },
          create: {
            pointsEarnedAsScout: scoutPoints,
            userId: scoutId,
            pointsEarnedAsBuilder: 0,
            currentBalance: scoutPoints
          }
        })
      ]);
    }

    const builderPoints = 0.2 * calculatedPoints;

    await prisma.$transaction([
      prisma.userSeasonStats.upsert({
        where: {
          userId_season: {
            userId: builder.id,
            season: currentSeason
          }
        },
        update: {
          pointsEarnedAsBuilder: {
            increment: builderPoints
          }
        },
        create: {
          pointsEarnedAsBuilder: builderPoints,
          userId: builder.id,
          season: currentSeason,
          pointsEarnedAsScout: 0
        }
      }),
      prisma.userAllTimeStats.upsert({
        where: {
          userId: builder.id
        },
        update: {
          pointsEarnedAsBuilder: {
            increment: builderPoints
          },
          pointsEarnedAsScout: {
            increment: 0
          },
          currentBalance: {
            increment: builderPoints
          }
        },
        create: {
          pointsEarnedAsBuilder: builderPoints,
          pointsEarnedAsScout: 0,
          currentBalance: builderPoints,
          userId: builder.id
        }
      })
    ]);
  }
}

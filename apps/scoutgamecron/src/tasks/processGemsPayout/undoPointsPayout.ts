import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { BuilderEvent, PointsReceipt } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function undoPointsPayout({ week }: { week: string }) {
  if (!week) {
    throw new InvalidInputError('week is required');
  }

  const earnedPointReceipts = await prisma.pointsReceipt
    .findMany({
      where: {
        event: {
          week,
          type: 'gems_payout'
        }
      },
      include: {
        event: true
      }
    })
    .then((receipts) =>
      receipts.reduce(
        (acc, val) => {
          if (val.recipientId) {
            if (!acc[val.recipientId]) {
              acc[val.recipientId] = [];
            }
            acc[val.recipientId].push(val);
          }

          return acc;
        },
        {} as Record<string, (PointsReceipt & { event: BuilderEvent })[]>
      )
    );

  const affectedUsers = Object.entries(earnedPointReceipts);

  log.info(`Found ${affectedUsers.length} users with points earned for week ${week}`);

  for (let i = 0; i < affectedUsers.length; i++) {
    const [userId, receipts] = affectedUsers[i];

    log.info(`Undoing points payout for user ${userId} ${i + 1}/${affectedUsers.length}`);

    const totalReceiptsValue = receipts.reduce((acc, val) => acc + val.value, 0);

    await prisma.$transaction(async (tx) => {
      if (receipts.length) {
        await tx.pointsReceipt.deleteMany({
          where: {
            id: {
              in: receipts.map((r) => r.id)
            }
          }
        });

        await tx.userSeasonStats.update({
          where: {
            userId_season: {
              userId,
              season: receipts[0].event.season
            }
          },
          data: {
            pointsEarnedAsScout: {
              decrement: totalReceiptsValue
            }
          }
        });

        await tx.userAllTimeStats.update({
          where: {
            userId
          },
          data: {
            pointsEarnedAsScout: {
              decrement: totalReceiptsValue
            }
          }
        });
      }
    });
  }

  const [deletedGemPayoutEvents, deletedBuilderEvents, deletedPointReceipts] = await prisma.$transaction([
    prisma.gemsPayoutEvent.deleteMany({
      where: {
        week
      }
    }),
    prisma.builderEvent.deleteMany({
      where: {
        type: 'gems_payout',
        week
      }
    }),
    prisma.pointsReceipt.deleteMany({
      where: {
        event: {
          type: 'gems_payout',
          week
        }
      }
    })
  ]);

  log.info(`Deleted ${deletedGemPayoutEvents.count} gem payout events`);
  log.info(`Deleted ${deletedBuilderEvents.count} builder events`);
  log.info(`Deleted ${deletedPointReceipts.count} point receipts`);
}

// undoPointsPayout({ week: '2024-W42' }).then(console.log);

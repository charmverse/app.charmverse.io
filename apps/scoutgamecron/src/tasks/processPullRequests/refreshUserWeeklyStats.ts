import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export async function refreshUserWeeklyStats({ season, week }: { season: number; week: string }) {
  const builders = await prisma.scout.findMany({
    where: {
      builder: true
    }
  });

  for (const builder of builders) {
    try {
      const builderEvents = await prisma.builderEvent.findMany({
        where: {
          season,
          week
        },
        select: {
          id: true,
          gemsReceipts: {
            select: {
              value: true
            }
          }
        }
      });

      const totalGems = builderEvents.reduce(
        (acc, event) => acc + event.gemsReceipts.reduce((_acc, receipt) => _acc + receipt.value, 0),
        0
      );

      await prisma.userWeeklyStats.upsert({
        where: {
          id: builder.id
        },
        create: {
          gemsCollected: totalGems,
          week,
          userId: builder.id
        },
        update: {
          gemsCollected: totalGems
        }
      });
    } catch (error) {
      log.error(`Error refreshing user weekly stats for builder ${builder.id}`, error);
    }
  }
}

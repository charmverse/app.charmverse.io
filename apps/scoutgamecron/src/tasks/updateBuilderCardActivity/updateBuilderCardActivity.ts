import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export type Last7DaysGems = { date: string; gemsCount: number }[];

export async function updateBuilderCardActivity(date: DateTime) {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
      id: true,
      builderCardActivities: true,
      events: {
        where: {
          gemsReceipt: {
            isNot: null
          },
          createdAt: {
            gte: date.minus({ days: 7 }).startOf('day').toISO(),
            lte: date.minus({ days: 1 }).endOf('day').toISO()
          }
        },
        select: {
          createdAt: true,
          gemsReceipt: {
            select: {
              value: true
            }
          }
        }
      }
    }
  });

  let updatedBuilders = 0;

  for (const builder of builders) {
    try {
      const dayGemsRecord: Record<string, number> = {};
      builder.events.forEach((event) => {
        const formattedDate = DateTime.fromJSDate(event.createdAt).toFormat('yyyy-MM-dd');
        dayGemsRecord[formattedDate] = (dayGemsRecord[formattedDate] ?? 0) + (event.gemsReceipt?.value ?? 0);
      });

      const last7Days = Object.entries(dayGemsRecord)
        .map(([formattedDate, gemsCount]) => ({ date: formattedDate, gemsCount }))
        .sort((a, b) => b.date.localeCompare(a.date));

      await prisma.builderCardActivity.upsert({
        where: { builderId: builder.id },
        update: { last7Days },
        create: { builderId: builder.id, last7Days }
      });
      updatedBuilders += 1;
    } catch (error) {
      log.error(`Error updating builder card activity for builder`, {
        builderId: builder.id,
        date,
        error
      });
    }
  }

  return updatedBuilders;
}

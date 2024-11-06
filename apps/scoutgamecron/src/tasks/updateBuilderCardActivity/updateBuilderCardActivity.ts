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

      const last7Days = Array.from({ length: 7 }, (_, i) => date.minus({ days: 7 - i }).toFormat('yyyy-MM-dd'));

      const last7DaysGems = last7Days.map((day) => ({
        date: day,
        gemsCount: dayGemsRecord[day] ?? 0
      }));

      await prisma.builderCardActivity.upsert({
        where: { builderId: builder.id },
        update: { last7Days: last7DaysGems },
        create: { builderId: builder.id, last7Days: last7DaysGems }
      });
      updatedBuilders += 1;
      // log.debug(`Upserted builder card activity for builder`, {
      //   userId: builder.id,
      //   date
      // });
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

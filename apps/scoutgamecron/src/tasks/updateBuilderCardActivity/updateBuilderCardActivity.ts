import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';
import type { DateTime } from 'luxon';

export type Last7DaysGems = { date: string; gemsCount: number }[];

export async function updateBuilderCardActivity(date: DateTime) {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    select: {
      id: true,
      builderCardActivities: true,
      events: {
        where: {
          type: {
            in: ['daily_commit', 'merged_pull_request']
          },
          createdAt: {
            gte: date.startOf('day').toISO(),
            lte: date.endOf('day').toISO()
          }
        },
        select: {
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
      const gemsCount = builder.events
        .map((event) => event.gemsReceipt?.value)
        .filter(isTruthy)
        .reduce((acc, curr) => acc + curr, 0);
      let last7Days = (builder.builderCardActivities[0]?.last7Days ?? []) as Last7DaysGems;
      const currentDay = last7Days.find((day) => day.date === date.toFormat('yyyy-MM-dd'));
      if (currentDay) {
        currentDay.gemsCount += gemsCount;
      } else {
        last7Days.push({ date: date.toFormat('yyyy-MM-dd'), gemsCount });
      }
      if (last7Days.length > 7) {
        last7Days = last7Days.slice(-7);
      }
      await prisma.builderCardActivity.upsert({
        where: { builderId: builder.id },
        update: { last7Days },
        create: { builderId: builder.id, last7Days }
      });
      updatedBuilders += 1;
    } catch (error) {
      log.error(`Error updating builder card activity for builder`, {
        builderId: builder.id,
        error
      });
    }
  }

  return updatedBuilders;
}

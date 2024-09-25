import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { getTopBuilders } from './getTopBuilders';

export async function updateBuildersRank({ week }: { week: string }) {
  const topBuilders = await getTopBuilders({ week });

  for (const { builder, rank } of topBuilders) {
    await prisma.userWeeklyStats.update({
      where: {
        userId_week: {
          userId: builder.id,
          week
        }
      },
      data: {
        rank
      }
    });
  }

  log.info(`Updated ${topBuilders.length} builders rank for week ${week}`);
}

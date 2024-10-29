import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshPointStatsFromHistory } from '@packages/scoutgame/points/refreshPointStatsFromHistory';
import { prettyPrint } from '@packages/utils/strings';

async function refreshPointsFromTransactionHistory() {
  const scouts = await prisma.scout.findMany({
    select: { id: true, path: true },
    orderBy: {
      id: 'asc'
    },
    where: {
      createdAt: {
        lte: new Date('2024-10-14')
      }
    }
  });

  for (let i = 0; i < scouts.length; i++) {
    const scout = scouts[i];
    try {
      log.info(`Fixing points for ${scout.path} ${i + 1} / ${scouts.length}`);
      const stats = await refreshPointStatsFromHistory({ userIdOrPath: scout.id });
      log.info(`Successfully fixed points for ${scout.path}. New balance: ${stats.balance}`);
    } catch (error) {
      log.error(`Failed to fix points for ${scout.path}: ${prettyPrint(error)}`);
    }
  }
}

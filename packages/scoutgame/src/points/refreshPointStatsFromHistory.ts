import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import { getPointStatsFromHistory, type PointStats } from './getPointStatsFromHistory';
import { setPointsEarnedStats } from './updatePointsEarned';

export async function refreshPointStatsFromHistory({
  userIdOrPath,
  season = currentSeason,
  tx
}: {
  userIdOrPath: string;
  season?: string;
  tx?: Prisma.TransactionClient;
}): Promise<PointStats> {
  async function txHandler(_tx: Prisma.TransactionClient) {
    const stats = await getPointStatsFromHistory({ userIdOrPath, tx: _tx });

    await setPointsEarnedStats({
      season,
      builderPoints: stats.pointsReceivedAsBuilder,
      scoutPoints: stats.pointsReceivedAsScout,
      userId: stats.userId,
      tx: _tx
    });

    await _tx.scout.update({
      where: {
        id: stats.userId
      },
      data: {
        currentBalance: Math.max(stats.balance, 0)
      }
    });

    return stats;
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPointStatsFromHistory } from '@packages/scoutgame/points/getPointStatsFromHistory';

export async function detectBalanceIssues() {
  const scouts = await prisma.scout.findMany({
    orderBy: {
      farcasterId: 'asc'
    },
    select: {
      id: true,
      farcasterId: true,
      farcasterName: true,
      currentBalance: true
    }
  });
  const totalScouts = scouts.length;

  log.info(`Checking ${totalScouts} scouts for balance issues...`);

  const scoutsWithBalanceIssues = [];

  for (let i = 0; i < totalScouts; i++) {
    log.info(
      `Checking scout ${i + 1} of ${totalScouts}: fid=${scouts[i].farcasterId}, name=${scouts[i].farcasterName}`
    );
    const scout = scouts[i];

    const balances = await getPointStatsFromHistory({
      userIdOrPath: scout.id
    });

    if (balances.balance !== scout.currentBalance) {
      log.error(
        `Scout (id: ${scout.id})  (fid:${scout.farcasterId}) has a balance discrepancy: ${balances.balance} (computed) vs ${scout.currentBalance} (current)`
      );
      scoutsWithBalanceIssues.push({
        farcasterId: scout.farcasterId,
        scoutId: scout.id,
        expectedBalance: balances.balance,
        currentBalance: scout.currentBalance,
        pointDetails: balances
      });
    }
  }

  return scoutsWithBalanceIssues;
}

import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { detectBalanceIssues } from '@packages/scoutgame/points/detectBalanceIssues';

export async function resolveBalanceIssues() {
  const balanceIssues = await detectBalanceIssues();

  for (let i = 0; i < balanceIssues.length; i++) {
    const balanceToResolve = balanceIssues[i];

    await prisma.builderEvent.create({
      data: {
        season: currentSeason,
        type: 'misc_event',
        week: getCurrentWeek(),
        builder: {
          connect: {
            id: balanceToResolve.scoutId
          }
        },
        pointsReceipts: {
          create: {
            value: balanceToResolve.expectedBalance - balanceToResolve.currentBalance,
            recipientId: balanceToResolve.scoutId
          }
        }
      }
    });
  }
}

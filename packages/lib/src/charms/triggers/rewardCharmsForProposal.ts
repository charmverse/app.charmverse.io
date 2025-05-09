import { prisma } from '@charmverse/core/prisma-client';
import { addCharms } from '@packages/lib/charms/addCharms';
import { CharmActionTrigger, charmActionRewards } from '@packages/lib/charms/constants';

/**
 * Reward user for creating first proposal (only once)
 */

export async function rewardCharmsForProposal(userId: string) {
  const existingTriggerTransaction = await prisma.charmTransaction.findMany({
    where: {
      toWallet: {
        userId
      },
      metadata: {
        path: ['actionTrigger'],
        equals: CharmActionTrigger.createFirstProposal
      }
    }
  });

  if (existingTriggerTransaction.length > 0) {
    return false;
  }

  await addCharms({
    recipient: { userId },
    amount: charmActionRewards.createFirstProposal,
    actionTrigger: CharmActionTrigger.createFirstProposal
  });

  return true;
}

import { prisma } from '@charmverse/core/prisma-client';
import { addTransaction } from '@packages/lib/charms/addTransaction';
import type { TransactionRecipient, TransactionResult } from '@packages/lib/charms/addTransaction';
import type { CharmActionTrigger } from '@packages/lib/charms/constants';
import { getUserOrSpaceWallet } from '@packages/lib/charms/getUserOrSpaceWallet';

/**
 * Spend space's charms by admin
 * @param recipient - Space ID or User ID
 * @param actorId - ID of user who triggered the action
 * @param actionTrigger - Action that triggered the charm addition
 * @param amount - Amount of charms to spend
 */
export async function addCharms({
  recipient,
  amount,
  actorId,
  actionTrigger
}: {
  recipient: TransactionRecipient;
  amount: number;
  actorId?: string;
  actionTrigger?: CharmActionTrigger;
}): Promise<TransactionResult> {
  const wallet = await getUserOrSpaceWallet(recipient);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const { id, balance, totalBalance } = wallet;

  const res = await prisma.$transaction([
    prisma.charmWallet.update({
      where: { id },
      data: { balance: balance + amount, totalBalance: totalBalance + amount }
    }),
    addTransaction({ fromAddress: undefined, toAddress: id, amount, metadata: { actorId, actionTrigger } })
  ]);

  return { balance: res[0].balance, txId: res[1].id };
}

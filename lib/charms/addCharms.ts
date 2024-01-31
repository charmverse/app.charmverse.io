import { prisma } from '@charmverse/core/prisma-client';

import { addCharmTransaction } from 'lib/charms/addCharmTransaction';
import type { CharmTxRecipient, CharmActionTrigger, CharmTxResult } from 'lib/charms/addCharmTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';

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
  recipient: CharmTxRecipient;
  amount: number;
  actorId?: string;
  actionTrigger?: CharmActionTrigger;
}): Promise<CharmTxResult> {
  const wallet = await getUserOrSpaceWallet(recipient);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const { id, balance } = wallet;

  const res = await prisma.$transaction([
    prisma.charmWallet.update({ where: { id }, data: { balance: balance + amount } }),
    addCharmTransaction({ fromAddress: undefined, toAddress: id, amount, metadata: { actorId, actionTrigger } })
  ]);

  return { balance: res[0].balance, txId: res[1].id };
}

import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { addCharmTransaction } from 'lib/charms/addCharmTransaction';
import type { CharmTxRecipient, CharmTxResult } from 'lib/charms/addCharmTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';

/**
 * Transfer charms from user to space or another user
 * @param sender - User ID
 * @param recipient - Space ID or User ID
 * @param amount - Amount of charms to transfer
 */
export async function transferCharms({
  sender,
  recipient,
  amount
}: {
  sender: string;
  recipient: CharmTxRecipient;
  amount: number;
}): Promise<CharmTxResult> {
  const senderWallet = await getUserOrSpaceWallet({ userId: sender });

  if (!senderWallet) {
    throw new Error('Sender wallet not found');
  }

  const { id: senderId, balance: senderBalance } = senderWallet;

  if (senderBalance < amount) {
    throw new InvalidInputError('Insufficient balance');
  }

  const recipientWallet = await getUserOrSpaceWallet(recipient);

  if (!recipientWallet) {
    throw new Error('Recipient wallet not found');
  }

  const { id: recipientId, balance: recipientBalance } = recipientWallet;

  const res = await prisma.$transaction([
    prisma.charmWallet.update({ where: { id: senderId }, data: { balance: senderBalance - amount } }),
    prisma.charmWallet.update({ where: { id: recipientId }, data: { balance: recipientBalance + amount } }),
    addCharmTransaction({ fromAddress: senderId, toAddress: recipientId, amount })
  ]);

  return { balance: res[0].balance, txId: res[2].id };
}

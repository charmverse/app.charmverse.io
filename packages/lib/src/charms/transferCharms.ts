import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { addTransaction } from '@packages/lib/charms/addTransaction';
import type { TransactionResult, TransactionRecipient } from '@packages/lib/charms/addTransaction';
import { getUserOrSpaceWallet } from '@packages/lib/charms/getUserOrSpaceWallet';

export type TransferCharmsInput = {
  amount: number;
  spaceId?: string;
  userId?: string;
};

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
  recipient: TransactionRecipient;
  amount: number;
}): Promise<TransactionResult> {
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
    addTransaction({ fromAddress: senderId, toAddress: recipientId, amount })
  ]);

  return { balance: res[0].balance, txId: res[2].id };
}

import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { addCharmTransaction } from 'lib/charms/addCharmTransaction';
import type { CharmTxRecipient } from 'lib/charms/addCharmTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';

export async function transferCharms({
  sender,
  recipient,
  amount
}: {
  sender: string;
  recipient: CharmTxRecipient;
  amount: number;
}): Promise<number> {
  const { address: senderAddress, balance: senderBalance } = await getUserOrSpaceWallet({ userId: sender });

  if (senderBalance < amount) {
    throw new InvalidInputError('Insufficient balance');
  }

  const { address: recipientAddress, balance: recipientBalance } = await getUserOrSpaceWallet(recipient);

  const res = await prisma.$transaction([
    prisma.charmWallet.update({ where: { address: recipientAddress }, data: { balance: recipientBalance + amount } }),
    prisma.charmWallet.update({ where: { address: senderAddress }, data: { balance: senderBalance - amount } }),
    addCharmTransaction({ fromAddress: senderAddress, toAddress: recipientAddress, amount })
  ]);

  return res[0].balance;
}

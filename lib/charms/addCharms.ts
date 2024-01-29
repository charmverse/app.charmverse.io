import { prisma } from '@charmverse/core/prisma-client';

import { addCharmTransaction } from 'lib/charms/addCharmTransaction';
import type { CharmTxRecipient, CharmActionTrigger } from 'lib/charms/addCharmTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';

type AddCharmsResult = {
  txId: string;
  balance: number;
};

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
}): Promise<AddCharmsResult> {
  const { id, balance } = await getUserOrSpaceWallet(recipient);

  const res = await prisma.$transaction([
    prisma.charmWallet.update({ where: { id }, data: { balance: balance + amount } }),
    addCharmTransaction({ fromAddress: undefined, toAddress: id, amount, metadata: { actorId, actionTrigger } })
  ]);

  return { balance: res[0].balance, txId: res[1].id };
}

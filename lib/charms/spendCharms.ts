import { InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { CharmTxResult } from 'lib/charms/addCharmTransaction';
import { addCharmTransaction } from 'lib/charms/addCharmTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';

/**
 * Spend space's charms by admin
 * @param spaceId - Space ID
 * @param actorId - Space Admin ID
 * @param amount - Amount of charms to spend
 */
export async function spendCharms({
  spaceId,
  actorId,
  amount
}: {
  spaceId: string;
  actorId: string;
  amount: number;
}): Promise<CharmTxResult> {
  const spaceRole = await prisma.spaceRole.findFirst({ where: { spaceId, userId: actorId } });

  if (!spaceRole?.isAdmin) {
    throw new UnauthorisedActionError('Only space admins can spend charms');
  }

  const { id: senderId, balance: senderBalance } = await getUserOrSpaceWallet({ spaceId });

  if (senderBalance < amount) {
    throw new InvalidInputError('Insufficient balance');
  }
  const res = await prisma.$transaction([
    prisma.charmWallet.update({ where: { id: senderId }, data: { balance: senderBalance - amount } }),
    addCharmTransaction({ fromAddress: senderId, toAddress: undefined, amount })
  ]);

  return { balance: res[0].balance, txId: res[1].id };
}

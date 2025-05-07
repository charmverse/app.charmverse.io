import { prisma } from '@charmverse/core/prisma-client';
import type { CharmActionTrigger } from '@packages/lib/charms/constants';

export type TransactionMetadata = {
  // actorId - could be different from userId if the action was triggered by someone else (i.e. CV team)
  actorId?: string;
  actionTrigger?: CharmActionTrigger;
};

export type TransactionRecipient = { userId: string } | { spaceId: string };

export type TransactionResult = {
  txId: string;
  balance: number;
};

export function addTransaction({
  fromAddress,
  toAddress,
  amount,
  metadata
}: {
  fromAddress?: string;
  toAddress?: string;
  amount: number;
  metadata?: TransactionMetadata;
}) {
  return prisma.charmTransaction.create({
    data: {
      from: fromAddress,
      to: toAddress,
      amount,
      metadata
    }
  });
}

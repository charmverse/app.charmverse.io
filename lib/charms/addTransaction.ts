import { prisma } from '@charmverse/core/prisma-client';

export enum CharmActionTrigger {
  'invite' = 'invite'
  // TODO: add more types like createPage, createSpace, etc.
}

type CharmTransactionMetadata = {
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
  metadata?: CharmTransactionMetadata;
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

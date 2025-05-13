import type { CharmTransaction } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { TransactionMetadata } from '@packages/lib/charms/addTransaction';
import { TRANSACTIONS_PAGE_SIZE } from '@packages/lib/charms/constants';
import { getUserOrSpaceWallet } from '@packages/lib/charms/getUserOrSpaceWallet';

export type TransactionRecipientType = 'user' | 'space';

export type HistoryTransactionMetadata = TransactionMetadata & {
  recipientName?: string;
  recipientType?: TransactionRecipientType;
  isReceived: boolean;
};

export type ListTransactionsHistoryParams = {
  userId: string;
  page?: number;
  pageSize?: number;
};

export type HistoryTransaction = CharmTransaction & {
  metadata: HistoryTransactionMetadata;
};

export async function listTransactionsHistory({
  userId,
  page = 0,
  pageSize = TRANSACTIONS_PAGE_SIZE
}: ListTransactionsHistoryParams): Promise<HistoryTransaction[]> {
  const toSkip = Math.max(page, page - 1) * pageSize;
  const userWallet = await getUserOrSpaceWallet({ userId, readOnly: true });

  if (!userWallet) {
    return [];
  }

  const txs = await prisma.charmTransaction.findMany({
    take: pageSize,
    skip: toSkip,
    where: {
      OR: [{ from: userWallet.id }, { to: userWallet.id }]
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      fromWallet: { include: { user: true, space: true } },
      toWallet: { include: { user: true, space: true } }
    }
  });

  const historyTxs = txs.map((tx) => {
    const isReceived = !!tx.to && !!userWallet && tx.to === userWallet.id;
    const recipientType = tx.toWallet?.space ? 'space' : 'user';
    const recipientName = tx.toWallet?.space?.name || tx.toWallet?.user?.username;

    const metadata: HistoryTransactionMetadata = {
      ...(tx.metadata as TransactionMetadata),
      recipientName,
      recipientType,
      isReceived
    };

    return {
      ...tx,
      metadata
    };
  });

  return historyTxs;
}

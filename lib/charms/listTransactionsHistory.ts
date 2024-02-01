import type { CharmTransaction } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export const TRANSACTIONS_PAGE_SIZE = 20;

export type ListTransactionsHistoryParams = {
  userId: string;
  page?: number;
  pageSize?: number;
};

export async function listTransactionsHistory({
  userId,
  page = 0,
  pageSize = TRANSACTIONS_PAGE_SIZE
}: ListTransactionsHistoryParams): Promise<CharmTransaction[]> {
  const toSkip = Math.max(page, page - 1) * pageSize;

  const txs = await prisma.charmTransaction.findMany({
    take: pageSize,
    skip: toSkip,
    where: {
      OR: [{ from: userId }, { to: userId }]
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // TOD: Add recipient (space) name to display in FE

  return txs;
}

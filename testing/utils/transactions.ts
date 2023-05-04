import { prisma } from '@charmverse/core';

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id }
  });
}

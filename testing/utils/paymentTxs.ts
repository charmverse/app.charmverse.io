import { prisma } from '@charmverse/core';

export async function getPaymentTxById(id: string) {
  return prisma.transaction.findUnique({
    where: { id }
  });
}

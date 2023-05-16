import { prisma } from '@charmverse/core/prisma-client';

export async function getPaymentTxById(id: string) {
  return prisma.transaction.findUnique({
    where: { id }
  });
}

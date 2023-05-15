import { prisma } from '@charmverse/core/prisma';

export async function getPaymentTxById(id: string) {
  return prisma.transaction.findUnique({
    where: { id }
  });
}

import { prisma } from '@charmverse/core/prisma-client';

export async function getTransaction(id: string) {
  return prisma.charmTransaction.findFirst({ where: { id } });
}

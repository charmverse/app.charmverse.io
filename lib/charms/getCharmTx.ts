import { prisma } from '@charmverse/core/prisma-client';

export async function getCharmTx(id: string) {
  return prisma.charmTransaction.findFirst({ where: { id } });
}

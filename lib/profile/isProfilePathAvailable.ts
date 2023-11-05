import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function isProfilePathAvailable(
  path: string,
  id?: string | null,
  tx: Prisma.TransactionClient = prisma
): Promise<boolean> {
  const existing = await tx.user.findUnique({
    where: {
      path
    },
    select: { id: true }
  });

  if (existing) {
    return id ? existing.id === id : false;
  }

  return true;
}

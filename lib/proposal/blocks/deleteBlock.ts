import { prisma } from '@charmverse/core/prisma-client';

export async function updateBlock({ blockId }: { blockId: string; userId: string }) {
  return prisma.proposalBlock.delete({
    where: {
      id: blockId
    }
  });
}

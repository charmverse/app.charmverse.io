import { prisma } from '@charmverse/core/prisma-client';

export function deleteBlock({ blockId }: { blockId: string }) {
  return prisma.proposalBlock.delete({
    where: {
      id: blockId
    }
  });
}

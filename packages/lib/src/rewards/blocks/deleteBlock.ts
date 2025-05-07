import { prisma } from '@charmverse/core/prisma-client';

export function deleteBlock({ blockId, spaceId }: { blockId: string; spaceId: string }) {
  return prisma.rewardBlock.delete({
    where: {
      id_spaceId: {
        spaceId,
        id: blockId
      }
    }
  });
}

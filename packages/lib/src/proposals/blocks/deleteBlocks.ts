import { prisma } from '@charmverse/core/prisma-client';
import { deleteBlock } from '@packages/lib/proposals/blocks/deleteBlock';

export async function deleteBlocks({ blocksData, spaceId }: { blocksData: string[]; userId: string; spaceId: string }) {
  return prisma.$transaction(blocksData.map((blockId) => deleteBlock({ blockId, spaceId })));
}

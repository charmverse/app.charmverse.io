import { prisma } from '@charmverse/core/prisma-client';
import { deleteBlock } from '@packages/lib/rewards/blocks/deleteBlock';

export async function deleteBlocks({ blocksData, spaceId }: { blocksData: string[]; userId: string; spaceId: string }) {
  // do not delete default internal blocks
  const blockIds = blocksData.filter((blockId) => !blockId.startsWith('__'));

  return prisma.$transaction(blockIds.map((blockId) => deleteBlock({ blockId, spaceId })));
}

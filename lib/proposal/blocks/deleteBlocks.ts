import { prisma } from '@charmverse/core/prisma-client';

import { deleteBlock } from 'lib/proposal/blocks/deleteBlock';

export async function deleteBlocks({ blocksData }: { blocksData: string[]; userId: string }) {
  return prisma.$transaction(blocksData.map((blockId) => deleteBlock({ blockId })));
}

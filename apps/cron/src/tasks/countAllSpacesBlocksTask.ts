import { prisma } from '@charmverse/core/prisma-client';
import { countSpaceBlocksAndSave } from '@packages/spaces/countSpaceBlocks/countAllSpaceBlocks';
import { deleteArchivalBlockCounts } from '@packages/spaces/deleteArchivalBlockCounts';

const perBatch = 1000;
export async function countAllSpacesBlocks({ offset = 0 }: { offset?: number } = {}): Promise<void> {
  // Load limited number of spaces at a time
  const spaces = await prisma.space.findMany({
    select: {
      id: true
    },
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    }
  });

  for (const space of spaces) {
    await countSpaceBlocksAndSave({ spaceId: space.id });
  }

  if (spaces.length > 0) {
    return countAllSpacesBlocks({ offset: offset + perBatch });
  }
}
export async function countAllSpacesBlocksTask(): Promise<void> {
  // Delete old block count entries
  await deleteArchivalBlockCounts();

  // Wrapped function since Cron will call the method with the date
  await countAllSpacesBlocks();
}

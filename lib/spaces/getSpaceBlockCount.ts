import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { BlockCount } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type BlockCountInfo = Pick<BlockCount, 'count' | 'details' | 'createdAt'>;

export async function getSpaceBlockCount({ spaceId }: { spaceId: string }): Promise<BlockCountInfo> {
  const blockCount = await prisma.blockCount.findFirst({
    where: {
      spaceId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!blockCount) {
    log.warn('No block count found for space', { spaceId });
    throw new DataNotFoundError(`Block count not found for space ${spaceId}`);
  }
  return {
    count: blockCount.count,
    details: blockCount.details,
    createdAt: blockCount.createdAt
  };
}

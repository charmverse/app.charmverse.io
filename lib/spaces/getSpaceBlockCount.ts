import type { BlockCount } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { countSpaceBlocks } from './countSpaceBlocks';

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

  if (blockCount) {
    return {
      count: blockCount.count,
      createdAt: blockCount.createdAt,
      details: blockCount.details
    };
  }

  const { counts, total } = await countSpaceBlocks({
    spaceId
  });

  return {
    count: total,
    details: counts,
    createdAt: new Date()
  };
}

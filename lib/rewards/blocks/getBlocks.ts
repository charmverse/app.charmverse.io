import { prisma } from '@charmverse/core/prisma-client';

import type { RewardBlockWithTypedFields } from 'lib/rewards/blocks/interfaces';

export async function getBlocks({
  spaceId,
  ids
}: {
  spaceId: string;
  ids?: string[];
}): Promise<RewardBlockWithTypedFields[]> {
  const blocks = await prisma.rewardBlock.findMany({
    where: {
      spaceId,
      id:
        Array.isArray(ids) && ids.length
          ? {
              in: ids
            }
          : undefined
    }
  });

  return blocks as RewardBlockWithTypedFields[];
}

import { prisma } from '@charmverse/core/prisma-client';
import type { BlockTypes } from '@root/lib/databases/block';
import type { RewardBlockWithTypedFields } from '@root/lib/rewards/blocks/interfaces';

export async function getBlocks({
  spaceId,
  type,
  ids
}: {
  spaceId: string;
  type?: BlockTypes;
  ids?: string[];
}): Promise<RewardBlockWithTypedFields[]> {
  const blocks = await prisma.rewardBlock.findMany({
    where: {
      spaceId,
      type,
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

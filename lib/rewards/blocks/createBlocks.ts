import { prisma } from '@charmverse/core/prisma-client';

import { createBlock } from 'lib/rewards/blocks/createBlock';
import type { RewardBlockInput, RewardBlockWithTypedFields } from 'lib/rewards/blocks/interfaces';

export async function createBlocks({
  blocksData,
  userId,
  spaceId
}: {
  blocksData: RewardBlockInput[];
  userId: string;
  spaceId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const promises = blocksData.map((data) => createBlock({ data, userId, spaceId, tx }));

    return Promise.all(promises) as Promise<RewardBlockWithTypedFields[]>;
  });
}

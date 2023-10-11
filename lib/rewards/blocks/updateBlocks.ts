import { prisma } from '@charmverse/core/prisma-client';

import type { RewardBlockUpdateInput, RewardBlockWithTypedFields } from 'lib/rewards/blocks/interfaces';
import { updateBlock } from 'lib/rewards/blocks/updateBlock';

export async function updateBlocks({
  blocksData,
  userId,
  spaceId
}: {
  blocksData: RewardBlockUpdateInput[];
  userId: string;
  spaceId: string;
}) {
  return prisma.$transaction(blocksData.map((data) => updateBlock({ data, userId, spaceId }))) as Promise<
    RewardBlockWithTypedFields[]
  >;
}

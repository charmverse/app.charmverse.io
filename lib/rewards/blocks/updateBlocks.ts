import { prisma } from '@charmverse/core/prisma-client';

import { updateBlock } from 'lib/proposal/blocks/updateBlock';
import type { RewardBlockUpdateInput, RewardBlockWithTypedFields } from 'lib/rewards/blocks/interfaces';

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

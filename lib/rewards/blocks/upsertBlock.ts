import type { Block, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getUpsertBlockInput } from 'lib/focalboard/customBlocks/getUpsertBlockInput';
import type { RewardBlockInput, RewardBlockUpdateInput } from 'lib/rewards/blocks/interfaces';

export function upsertBlock({
  data,
  userId,
  spaceId,
  tx = prisma
}: {
  data: RewardBlockInput | RewardBlockUpdateInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  const input = getUpsertBlockInput({ data: data as unknown as Block, userId, spaceId });

  return tx.rewardBlock.upsert(input);
}

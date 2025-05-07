import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import { getUpsertBlockInput } from '@packages/databases/customBlocks/getUpsertBlockInput';
import type { RewardBlockInput, RewardBlockUpdateInput } from '@packages/lib/rewards/blocks/interfaces';

export function upsertBlock({
  data,
  userId,
  spaceId,
  tx = prisma,
  createOnly = false
}: {
  data: Board | BoardView | RewardBlockInput | RewardBlockUpdateInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
  createOnly?: boolean;
}) {
  const input = getUpsertBlockInput({ data, userId, spaceId, createOnly });

  return tx.rewardBlock.upsert(input);
}

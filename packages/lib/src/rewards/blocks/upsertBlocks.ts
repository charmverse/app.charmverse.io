import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { filterInternalProperties } from '@packages/databases/utilities';
import type {
  RewardBlockUpdateInput,
  RewardBlockWithTypedFields,
  RewardPropertyValues
} from '@packages/lib/rewards/blocks/interfaces';
import { upsertBlock } from '@packages/lib/rewards/blocks/upsertBlock';
import { updateRewardSettings } from '@packages/lib/rewards/updateRewardSettings';

export async function upsertBlocks({
  blocksData,
  userId,
  spaceId
}: {
  blocksData: RewardBlockUpdateInput[];
  userId: string;
  spaceId: string;
}) {
  const blocks = blocksData.filter((block) => block.type !== 'card');
  const rewards = blocksData.filter((block) => block.type === 'card');

  try {
    const promises = rewards.map((reward) =>
      updateRewardSettings({
        rewardId: reward.id,
        updateContent: {
          fields: {
            ...(reward.fields as RewardPropertyValues),
            properties: filterInternalProperties<Prisma.JsonValue>((reward.fields as RewardPropertyValues).properties)
          }
        }
      })
    );

    await Promise.allSettled(promises);
  } catch (error) {
    log.error('Error updating reward block fields', { error });
    throw error;
  }

  return prisma.$transaction(blocks.map((data) => upsertBlock({ data, userId, spaceId }))) as Promise<
    RewardBlockWithTypedFields[]
  >;
}

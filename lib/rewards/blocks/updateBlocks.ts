import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { filterInternalProperties } from 'lib/focalboard/utilities';
import type {
  RewardBlockUpdateInput,
  RewardBlockWithTypedFields,
  RewardPropertyValues
} from 'lib/rewards/blocks/interfaces';
import { updateBlock } from 'lib/rewards/blocks/updateBlock';
import { updateRewardSettings } from 'lib/rewards/updateRewardSettings';

export async function updateBlocks({
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
            ...reward.fields,
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

  return prisma.$transaction(blocks.map((data) => updateBlock({ data, userId, spaceId }))) as Promise<
    RewardBlockWithTypedFields[]
  >;
}

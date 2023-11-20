import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { RewardBlockInput } from 'lib/rewards/blocks/interfaces';
import { updateBlock } from 'lib/rewards/blocks/updateBlock';

export async function createBlock({
  data,
  userId,
  spaceId,
  tx = prisma
}: {
  data: RewardBlockInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  const { type } = data;

  if (!data.type || !data.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  // there should be only 1 block with properties for space
  if (type === 'board') {
    // there should be only 1 block with properties for space
    const currentPropertiesBlock = await tx.rewardBlock.findFirst({ where: { spaceId, type } });

    if (currentPropertiesBlock) {
      return updateBlock({ data: { ...data, id: currentPropertiesBlock.id }, userId, spaceId, tx });
    }
  }

  const fields = data.fields as any;
  // make sure to not save local settings
  if (fields) {
    delete fields.localSortOption;
    delete fields.localFilter;
  }

  return tx.rewardBlock.create({
    data: {
      ...data,
      spaceId,
      id: data.id || v4(),
      createdBy: userId,
      updatedBy: userId,
      parentId: data.parentId || '',
      rootId: data.rootId || data.spaceId || spaceId,
      schema: data.schema || 1,
      title: data.title || '',
      fields: (fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue
    }
  });
}

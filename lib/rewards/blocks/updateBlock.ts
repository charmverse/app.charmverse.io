import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { RewardBlockUpdateInput } from 'lib/rewards/blocks/interfaces';

export function updateBlock({
  data,
  userId,
  spaceId,
  tx = prisma
}: {
  data: RewardBlockUpdateInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  if (!data.id || !data.type || !data.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  const fields = data.fields as any;
  // make sure to not save local settings
  if (fields) {
    delete fields.localSortOption;
    delete fields.localFilter;
  }

  if (data.type === 'board' || data.type === 'view') {
    return tx.rewardBlock.upsert({
      where: {
        id_spaceId: {
          id: data.id,
          spaceId
        },
        type: data.type
      },
      update: {
        ...data,
        spaceId,
        rootId: spaceId,
        fields: (fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue,
        updatedBy: userId
      },
      create: {
        ...data,
        spaceId,
        rootId: spaceId,
        createdBy: userId,
        updatedBy: userId,
        parentId: data.parentId || '',
        title: data.title || '',
        schema: 1,
        fields: (data.fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue
      }
    });
  }

  return tx.rewardBlock.update({
    where: {
      id_spaceId: {
        id: data.id,
        spaceId
      },
      type: data.type
    },
    data: {
      ...data,
      fields: (data.fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue,
      updatedBy: userId
    }
  });
}

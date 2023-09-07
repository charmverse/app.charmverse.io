import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { ProposalBlockInput } from 'lib/proposal/blocks/interfaces';
import { updateBlock } from 'lib/proposal/blocks/updateBlock';

export async function createBlock({
  data,
  userId,
  spaceId,
  tx = prisma
}: {
  data: ProposalBlockInput;
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
    const currentPropertiesBlock = await tx.proposalBlock.findFirst({ where: { spaceId, type } });

    if (currentPropertiesBlock) {
      return updateBlock({ data: { ...data, id: currentPropertiesBlock.id }, userId, spaceId, tx });
    }
  }

  return tx.proposalBlock.create({
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
      fields: (data.fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue
    }
  });
}

import { InvalidInputError } from '@charmverse/core/errors';
import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { ProposalBlockType, prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { ProposalBlockInput } from 'lib/proposal/blocks/interfaces';
import { updateBlock } from 'lib/proposal/blocks/updateBlock';

export async function createBlock({
  data,
  userId,
  tx = prisma
}: {
  data: ProposalBlockInput;
  userId: string;
  tx?: PrismaTransactionClient;
}) {
  const { type, spaceId } = data;

  if (!data.type || !data.spaceId || !data.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  if (type === ProposalBlockType.properties) {
    // there should be only 1 block with properties for space
    const currentPropertiesBlock = await tx.proposalBlock.findFirst({ where: { spaceId, type } });

    if (currentPropertiesBlock) {
      return updateBlock({ data: { ...data, id: currentPropertiesBlock.id }, userId, tx });
    }
  }

  return tx.proposalBlock.create({
    data: {
      ...data,
      id: v4(),
      createdBy: userId,
      updatedBy: userId,
      parentId: data.parentId || '',
      rootId: data.rootId || data.spaceId,
      schema: data.schema || 1,
      title: data.title || '',
      fields: data.fields || {}
    }
  });
}

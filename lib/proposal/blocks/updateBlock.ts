import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposal/blocks/constants';
import type { ProposalBlockUpdateInput } from 'lib/proposal/blocks/interfaces';

export function updateBlock({
  data,
  userId,
  spaceId,
  tx = prisma
}: {
  data: ProposalBlockUpdateInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  if (!data.id || !data.type || !data.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  if (data.type === 'board') {
    return tx.proposalBlock.upsert({
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
        fields: (data.fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue,
        updatedBy: userId
      },
      create: {
        ...data,
        id: DEFAULT_BOARD_BLOCK_ID,
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

  return tx.proposalBlock.update({
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

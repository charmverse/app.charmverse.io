import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

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

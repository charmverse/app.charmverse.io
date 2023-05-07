import { prisma } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/prisma';

import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';

type DefaultCategoryAssignment = {
  proposalCategoryId: string;
  tx?: Prisma.TransactionClient;
};

export async function assignDefaultProposalCategoryPermissions({
  proposalCategoryId,
  tx = prisma
}: DefaultCategoryAssignment): Promise<void> {
  const category = await tx.proposalCategory.findUnique({
    where: {
      id: proposalCategoryId
    },
    select: {
      spaceId: true
    }
  });

  if (!category) {
    throw new ProposalCategoryNotFoundError(proposalCategoryId);
  }

  await tx.proposalCategoryPermission.create({
    data: {
      permissionLevel: 'full_access',
      proposalCategory: { connect: { id: proposalCategoryId } },
      space: { connect: { id: category.spaceId } }
    }
  });
}

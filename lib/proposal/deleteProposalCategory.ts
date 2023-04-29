import { prisma } from '@charmverse/core';

import { UndesirableOperationError } from 'lib/utilities/errors';

export async function deleteProposalCategory(id: string) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      categoryId: id
    },
    select: {
      id: true,
      category: {
        select: {
          title: true
        }
      }
    }
  });

  if (proposal) {
    throw new UndesirableOperationError(
      `${proposal.category?.title} proposal category  cannot be deleted as it contains proposals.`
    );
  }

  return prisma.proposalCategory.delete({
    where: {
      id
    }
  });
}

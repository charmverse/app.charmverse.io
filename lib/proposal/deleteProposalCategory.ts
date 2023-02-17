import { prisma } from 'db';
import { UndesirableOperationError } from 'lib/utilities/errors';

export async function deleteProposalCategory(id: string) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      categoryId: id
    },
    select: {
      id: true
    }
  });

  if (proposal) {
    throw new UndesirableOperationError(`Proposal category cannot be deleted as it contains more than 1 proposal`);
  }

  return prisma.proposalCategory.delete({
    where: {
      id
    }
  });
}

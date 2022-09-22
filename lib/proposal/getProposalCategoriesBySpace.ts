import { prisma } from 'db';

export function getProposalCategoriesBySpace (spaceId: string) {
  return prisma.proposalCategory.findMany({
    where: {
      spaceId
    }
  });
}

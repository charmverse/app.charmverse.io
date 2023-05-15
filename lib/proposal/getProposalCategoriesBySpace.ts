import { prisma } from '@charmverse/core/prisma';

export function getProposalCategoriesBySpace(spaceId: string) {
  return prisma.proposalCategory.findMany({
    where: {
      spaceId
    }
  });
}

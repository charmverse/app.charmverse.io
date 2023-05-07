import { prisma } from '@charmverse/core';

export function getProposalCategoriesBySpace(spaceId: string) {
  return prisma.proposalCategory.findMany({
    where: {
      spaceId
    }
  });
}

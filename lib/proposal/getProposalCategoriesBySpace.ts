import { prisma } from '@charmverse/core/prisma-client';

export function getProposalCategoriesBySpace(spaceId: string) {
  return prisma.proposalCategory.findMany({
    where: {
      spaceId
    }
  });
}

import { prisma } from 'db';

export function deleteProposalCategory (id: string) {
  return prisma.proposalCategory.delete({
    where: {
      id
    }
  });
}

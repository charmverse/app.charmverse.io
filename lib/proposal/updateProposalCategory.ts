import { prisma } from 'db';

import type { ProposalCategory } from './interface';

export function updateProposalCategory(id: string, data: Partial<ProposalCategory>) {
  return prisma.proposalCategory.update({
    where: {
      id
    },
    data: {
      title: data.title,
      color: data.color
    }
  });
}

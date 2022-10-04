import { prisma } from 'db';

import type { ProposalCategory } from './interface';

export function createProposalCategory (data: Omit<ProposalCategory, 'id'>) {
  return prisma.proposalCategory.create({
    data
  });
}

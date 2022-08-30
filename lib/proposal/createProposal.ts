import { Prisma } from '@prisma/client';
import { prisma } from 'db';

export function createProposal (proposalData: Prisma.ProposalCreateInput) {
  return prisma.proposal.create({
    data: proposalData
  });
}

import { prisma } from 'db';
import { ExtendedProposal } from './interface';

export async function getProposalTasks (userId: string): Promise<ExtendedProposal[]> {
  const proposals = await prisma.proposal.findMany({
    include: {
      authors: true,
      reviewers: true,
      page: true,
      space: true
    }
  });

  return proposals as ExtendedProposal[];
}

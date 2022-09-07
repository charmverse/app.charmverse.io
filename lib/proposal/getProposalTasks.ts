import { prisma } from 'db';
import { ExtendedProposals } from './interface';

export async function getProposalTasks (userId: string): Promise<ExtendedProposals[]> {
  const proposals = await prisma.proposal.findMany({
    include: {
      authors: true,
      reviewers: true,
      page: true,
      space: true
    }
  });

  return proposals;
}

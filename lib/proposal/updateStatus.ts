import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError, NotFoundError } from 'lib/middleware';

const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  private_draft: ['draft', 'discussion'],
  draft: ['private_draft', 'discussion'],
  discussion: ['draft', 'review'],
  review: ['reviewed'],
  reviewed: ['vote_active'],
  vote_active: ['vote_closed'],
  vote_closed: []
};

export async function updateStatus (proposalId: string, newStatus: ProposalStatus) {
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  if (!proposalStatusTransitionRecord[proposal.status].includes(newStatus)) {
    throw new InvalidStateError();
  }

  return prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: newStatus
    }
  });
}

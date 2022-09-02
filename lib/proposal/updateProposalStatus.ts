import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';

const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  private_draft: ['draft', 'discussion'],
  draft: ['private_draft', 'discussion'],
  discussion: ['draft', 'review'],
  review: ['reviewed'],
  reviewed: ['vote_active'],
  vote_active: ['vote_closed'],
  vote_closed: []
};

export async function updateProposalStatus ({
  proposalId,
  newStatus,
  currentStatus
}: {
  proposalId: string,
  newStatus: ProposalStatus,
  currentStatus: ProposalStatus
}) {
  if (!proposalStatusTransitionRecord[currentStatus].includes(newStatus)) {
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

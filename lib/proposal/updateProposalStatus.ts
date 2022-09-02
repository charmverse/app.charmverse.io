import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';

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

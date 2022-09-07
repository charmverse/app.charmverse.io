import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';

export async function updateProposalStatus ({
  proposalId,
  newStatus,
  currentStatus,
  userId
}: {
  userId: string
  proposalId: string,
  newStatus: ProposalStatus,
  currentStatus: ProposalStatus
}) {
  // Going from review to review, mark the reviewer in the proposal
  if (currentStatus === 'review' && newStatus === 'reviewed') {
    await prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        reviewer: {
          connect: {
            id: userId
          }
        },
        reviewedAt: new Date()
      }
    });
  }
  else if (currentStatus === 'reviewed' && newStatus === 'discussion') {
    await prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        reviewedBy: null,
        reviewedAt: null
      }
    });
  }

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

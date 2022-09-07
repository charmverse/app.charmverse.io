import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { ProposalWithUsers } from './interface';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';

export async function updateProposalStatus ({
  proposal,
  newStatus,
  userId
}: {
  userId: string
  newStatus: ProposalStatus,
  proposal: ProposalWithUsers
}) {
  const currentStatus = proposal.status;
  const proposalId = proposal.id;

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

  if (newStatus === 'review' && proposal.reviewers.length === 0) {
    throw new InvalidStateError('Proposal must have atleast one reviewer');
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

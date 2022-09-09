import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { MissingDataError } from 'lib/utilities/errors';
import { ProposalWithUsers } from './interface';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export async function updateProposalStatus ({
  proposal,
  newStatus,
  userId
}: {
  userId: string
  newStatus: ProposalStatus,
  proposal: ProposalWithUsers | string
}) {

  if (typeof proposal === 'string') {
    proposal = await prisma.proposal.findUnique({
      where: {
        id: proposal
      },
      select: {
        status: true
      }
    }) as ProposalWithUsers;
  }

  if (!proposal) {
    throw new MissingDataError(`Proposal with id ${proposal} not found`);
  }

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

  if (!proposalStatusTransitionRecord[proposal.status].includes(newStatus)) {
    throw new InvalidStateError();
  }

  const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId });

  return prisma.$transaction([
    prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        status: newStatus
      }
    }),
    prisma.pagePermission.deleteMany(deleteArgs),
    ...createArgs.map(arg => prisma.pagePermission.create(arg))
  ]).then(tx => tx[0]);
}

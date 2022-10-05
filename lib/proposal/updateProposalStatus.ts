import type { ProposalStatus, WorkspaceEvent } from '@prisma/client';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { MissingDataError } from 'lib/utilities/errors';

import type { ProposalWithUsers } from './interface';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export async function updateProposalStatus ({
  proposal,
  newStatus,
  userId
}: {
  userId: string;
  newStatus: ProposalStatus;
  proposal: ProposalWithUsers | string;
}): Promise<{
  proposal: ProposalWithUsers;
  workspaceEvent: WorkspaceEvent;
}> {

  if (typeof proposal === 'string') {
    proposal = await prisma.proposal.findUnique({
      where: {
        id: proposal
      },
      include: {
        authors: true,
        reviewers: true
      }
    }) as ProposalWithUsers;
  }

  if (!proposal) {
    throw new MissingDataError(`Proposal with id ${proposal} not found`);
  }

  const currentStatus = proposal.status;
  const proposalId = proposal.id;
  const proposalSpaceId = proposal.spaceId;

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

  return prisma.$transaction(async () => {
    const createdWorkspaceEvent = await prisma.workspaceEvent.create({
      data: {
        type: 'proposal_status_change',
        actorId: userId,
        pageId: proposalId,
        spaceId: proposalSpaceId,
        meta: {
          newStatus,
          oldStatus: currentStatus
        }
      }
    });
    const updatedProposal = await prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        status: newStatus
      },
      include: {
        authors: true,
        reviewers: true,
        category: true
      }
    });

    const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId });

    await prisma.pagePermission.deleteMany(deleteArgs);

    for (const arg of createArgs) {
      await prisma.pagePermission.create(arg);
    }
    return {
      workspaceEvent: createdWorkspaceEvent,
      proposal: updatedProposal
    };
  });

}

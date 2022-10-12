import type { ProposalStatus, WorkspaceEvent } from '@prisma/client';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { MissingDataError } from 'lib/utilities/errors';

import type { ProposalWithUsers } from './interface';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export async function updateProposalStatus ({
  proposalId,
  newStatus,
  userId
}: {
  userId: string;
  newStatus: ProposalStatus;
  proposalId: string;
}): Promise<{
  proposal: ProposalWithUsers;
  workspaceEvent: WorkspaceEvent;
}> {

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      category: true,
      authors: true,
      reviewers: true,
      page: {
        select: {
          snapshotProposalId: true
        }
      }
    }
  }) as ProposalWithUsers & { page: { snapshotProposalId?: string } };

  if (!proposal) {
    throw new MissingDataError(`Proposal with id ${proposal} not found`);
  }

  const currentStatus = proposal.status;
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

  const snapshotProposal = proposal.page.snapshotProposalId ? await getSnapshotProposal(proposal.page.snapshotProposalId) : null;

  return prisma.$transaction(async (tx) => {
    const createdWorkspaceEvent = await tx.workspaceEvent.create({
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
    const updatedProposal = await tx.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        status: newStatus,
        snapshotProposalExpiry: snapshotProposal?.end ? new Date(coerceToMilliseconds(snapshotProposal.end)) : undefined
      },
      include: {
        authors: true,
        reviewers: true,
        category: true
      }
    });

    const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId, tx });

    await tx.pagePermission.deleteMany(deleteArgs);

    for (const arg of createArgs) {
      await tx.pagePermission.create(arg);
    }
    return {
      workspaceEvent: createdWorkspaceEvent,
      proposal: updatedProposal
    };
  });

}

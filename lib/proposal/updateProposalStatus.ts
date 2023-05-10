import { prisma } from '@charmverse/core';
import type { WorkspaceEvent } from '@charmverse/core/prisma';
import { ProposalStatus } from '@charmverse/core/prisma';

import { InvalidStateError } from 'lib/middleware';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InvalidInputError } from 'lib/utilities/errors';

import { computeProposalFlowPermissions } from '../permissions/proposals/computeProposalFlowPermissions';

import type { ProposalWithUsers } from './interface';

export async function updateProposalStatus({
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
  if (!newStatus || !ProposalStatus[newStatus]) {
    throw new InvalidInputError('Please provide a valid status');
  } else if (!proposalId) {
    throw new InvalidInputError('Please provide a valid proposalId');
  }
  // const proposal = (await prisma.proposal.findUnique({
  //   where: {
  //     id: proposalId
  //   },
  //   include: {
  //     category: true,
  //     authors: true,
  //     reviewers: true,
  //     page: {
  //       select: {
  //         snapshotProposalId: true
  //       }
  //     }
  //   }
  // })) as ProposalWithUsers & { page: { snapshotProposalId?: string } };

  const statusFlow = await computeProposalFlowPermissions({
    proposalId,
    userId
  });

  if (!statusFlow[newStatus]) {
    throw new InvalidStateError(`Invalid transition to proposal status "${newStatus}"`);
  }

  await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: newStatus,
      // Only record these if the new proposal status is reviewed
      // If moving back to discussion, remove the reviewer and reviewedAt
      reviewedBy: newStatus === 'reviewed' ? userId : newStatus === 'discussion' ? null : undefined,
      reviewedAt: newStatus === 'reviewed' ? new Date() : newStatus === 'discussion' ? null : undefined
    }
  });

  const proposalInfo = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      spaceId: true,
      status: true,
      page: {
        select: {
          snapshotProposalId: true
        }
      }
    }
  });

  const snapshotProposalId = proposalInfo?.page?.snapshotProposalId;

  const snapshotProposal = snapshotProposalId ? await getSnapshotProposal(snapshotProposalId) : null;

  return prisma.$transaction(async (tx) => {
    const createdWorkspaceEvent = await tx.workspaceEvent.create({
      data: {
        type: 'proposal_status_change',
        actorId: userId,
        pageId: proposalId,
        spaceId: proposalInfo?.spaceId as string,
        meta: {
          newStatus,
          oldStatus: proposalInfo?.status as string
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

    return {
      workspaceEvent: createdWorkspaceEvent,
      proposal: updatedProposal
    };
  });
}

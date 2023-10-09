import type { WorkspaceEvent } from '@charmverse/core/prisma';
import { ProposalStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InvalidInputError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { ProposalNotFoundError } from './errors';
import type { ProposalWithUsersAndRubric } from './interface';

export async function updateProposalStatus({
  proposalId,
  newStatus,
  userId
}: {
  userId: string;
  newStatus: ProposalStatus;
  proposalId: string;
}): Promise<ProposalWithUsersAndRubric> {
  if (!newStatus || !ProposalStatus[newStatus]) {
    throw new InvalidInputError('Please provide a valid status');
  } else if (!proposalId) {
    throw new InvalidInputError('Please provide a valid proposalId');
  }

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      spaceId: true,
      archived: true,
      status: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(proposalId);
  } else if (proposal.archived) {
    throw new InvalidStateError(`Archived proposals cannot be updated`);
  }

  const statusFlow = await getPermissionsClient({ resourceId: proposalId, resourceIdType: 'proposal' }).then(
    ({ client }) =>
      client.proposals.computeProposalFlowPermissions({
        resourceId: proposalId,
        userId
      })
  );

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
    if (proposalInfo) {
      await publishProposalEvent({
        newStatus,
        proposalId,
        oldStatus: proposalInfo.status,
        scope: WebhookEventNames.ProposalStatusChanged,
        spaceId: proposal.spaceId,
        userId
      });
    }
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
        category: true,
        rubricAnswers: true,
        rubricCriteria: true
      }
    });

    return updatedProposal as ProposalWithUsersAndRubric;
  });
}

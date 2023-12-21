import { ProposalStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { InvalidInputError } from 'lib/utilities/errors';

import { ProposalNotFoundError } from './errors';

export async function updateProposalStatusOnly({
  proposalId,
  newStatus,
  userId
}: {
  userId: string;
  newStatus: 'published' | 'draft';
  proposalId: string;
}) {
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

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    useProposalEvaluationPermissions: true,
    userId
  });

  if (!permissions.move) {
    throw new InvalidStateError(`You do not have permission to move this proposal to "${newStatus}"`);
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

import { ProposalNotFoundError } from '@charmverse/core/errors';
import type { PermissionCompute, ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import { TransitionFlags, getProposalFlagFilters } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import { isProposalReviewer } from 'lib/proposal/isProposalReviewer';

import { permissionsApiClient } from '../api/routers';

import { countReviewers } from './countReviewers';

const filters = getProposalFlagFilters({
  computeProposalPermissions: permissionsApiClient.proposals.computeProposalPermissions,
  // In public mode, only take into account user reviewers
  countReviewers,
  isProposalReviewer
});

export async function computeProposalFlowPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<ProposalFlowPermissionFlags> {
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: resourceId
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(resourceId);
  }

  if (!userId) {
    return new TransitionFlags().empty;
  }

  return filters[proposal.status]({
    proposal,
    userId
  });
}

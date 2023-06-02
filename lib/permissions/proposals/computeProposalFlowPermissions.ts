import type { PermissionCompute, ProposalFlowPermissionFlags } from '@charmverse/core';
import { ProposalNotFoundError, TransitionFlags, getProposalFlagFilters } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';

import { computeProposalPermissions } from './computeProposalPermissions';
import { countReviewers } from './countReviewers';

const filters = getProposalFlagFilters({
  computeProposalPermissions,
  // In public mode, only take into account user reviewers
  countReviewers
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

import type { PermissionCompute, ProposalFlowPermissionFlags } from '@charmverse/core';
import { ProposalNotFoundError, TransitionFlags, getProposalFlagFilters, prisma } from '@charmverse/core';

import { computeProposalPermissions } from './computeProposalPermissions';

const filters = getProposalFlagFilters({
  computeProposalPermissions
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

import {
  buildComputePermissionsWithPermissionFilteringPolicies,
  prisma,
  isProposalAuthor,
  isProposalReviewer,
  getDefaultProposalPermissionPolicies
} from '@charmverse/core';
import type { ProposalResource, ProposalPermissionFlags, PermissionCompute } from '@charmverse/core';

import { filterApplicablePermissions } from 'lib/permissions/filterApplicablePermissions';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import { proposalPermissionsMapping } from '../mapping';

export async function baseComputeProposalPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<ProposalPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid proposal ID: ${resourceId}`);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      status: true,
      categoryId: true,
      spaceId: true,
      createdBy: true,
      authors: true,
      reviewers: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(`${resourceId}`);
  }

  const { spaceRole, isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId,
    disallowGuest: true
  });

  const permissions = new AvailableProposalPermissions();

  if (isAdmin) {
    return permissions.full;
  }

  if (!proposal.categoryId) {
    throw new InvalidInputError(`Cannot compute permissions for proposal ${resourceId} without category`);
  }

  if (isProposalAuthor({ proposal, userId })) {
    permissions.addPermissions(['edit', 'view', 'create_vote', 'delete', 'vote', 'comment', 'make_public']);
  }

  const isReviewer = isProposalReviewer({
    proposal,
    userId
  });

  if (isReviewer) {
    permissions.addPermissions(['view', 'comment', 'review']);
  }

  return {} as any;
}

function proposalResolver({ resourceId }: { resourceId: string }) {
  return prisma.proposal.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      status: true,
      categoryId: true,
      spaceId: true,
      createdBy: true,
      authors: true,
      reviewers: true
    }
  }) as Promise<ProposalResource>;
}

export const computeProposalPermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  ProposalResource,
  ProposalPermissionFlags
>({
  resolver: proposalResolver,
  computeFn: baseComputeProposalPermissions,
  policies: [
    ...getDefaultProposalPermissionPolicies({
      isProposalReviewer
    })
  ]
});

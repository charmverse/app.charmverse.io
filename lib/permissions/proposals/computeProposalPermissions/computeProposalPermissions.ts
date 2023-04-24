import { prisma } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/dist/prisma';

import { filterApplicablePermissions } from 'lib/permissions/filterApplicablePermissions';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { isProposalReviewer } from 'lib/proposal/isProposalReviewer';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import { isProposalAuthor } from '../../../proposal/isProposalAuthor';
import { buildComputePermissionsWithPermissionFilteringPolicies } from '../../buildComputePermissionsWithPermissionFilteringPolicies';
import type { PermissionCompute } from '../../interfaces';
import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';
import { proposalPermissionsMapping } from '../mapping';

import type { ProposalResource } from './interfaces';
import { policyStatusDiscussionEditableCommentable } from './policyStatusDiscussionEditableCommentable';
import { policyStatusDraftNotViewable } from './policyStatusDraftNotViewable';
import { policyStatusReviewCommentable } from './policyStatusReviewCommentable';
import { policyStatusReviewedOnlyCreateVote } from './policyStatusReviewedOnlyCreateVote';
import { policyStatusVoteActiveOnlyVotable } from './policyStatusVoteActiveOnlyVotable';
import { policyStatusVoteClosedViewOnly } from './policyStatusVoteClosedViewOnly';

export async function baseComputeProposalPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AvailableProposalPermissionFlags> {
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

  const assignedPermissions = await prisma.proposalCategoryPermission.findMany({
    where: {
      proposalCategoryId: proposal.categoryId
    }
  });

  if (isProposalAuthor({ proposal, userId })) {
    permissions.addPermissions(['edit', 'view', 'create_vote', 'delete', 'vote', 'comment', 'make_public']);
  }

  const isReviewer = await isProposalReviewer({
    proposal,
    userId
  });
  if (isReviewer) {
    permissions.addPermissions(['view', 'comment', 'review']);
  }

  const applicablePermissions = await filterApplicablePermissions({
    permissions: assignedPermissions,
    resourceSpaceId: proposal.spaceId,
    // Treat user as a guest if they are not a full member of the space
    userId: !spaceRole || spaceRole?.isGuest ? undefined : userId
  });

  applicablePermissions.forEach((permission) => {
    permissions.addPermissions(proposalPermissionsMapping[permission.permissionLevel].slice());
  });
  return permissions.operationFlags;
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
  AvailableProposalPermissionFlags
>({
  resolver: proposalResolver,
  computeFn: baseComputeProposalPermissions,
  policies: [
    policyStatusDraftNotViewable,
    policyStatusDiscussionEditableCommentable,
    policyStatusReviewCommentable,
    policyStatusReviewedOnlyCreateVote,
    policyStatusVoteActiveOnlyVotable,
    policyStatusVoteClosedViewOnly
  ]
});

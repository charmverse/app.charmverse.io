import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import { buildComputePermissionsWithPermissionFilteringPolicies } from '../../buildComputePermissionsWithPermissionFilteringPolicies';
import type { PermissionCompute } from '../../interfaces';
import { AvailableProposalPermissions } from '../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../interfaces';
import { proposalPermissionsMapping } from '../mapping';

import type { ProposalResource } from './interfaces';
import { isProposalAuthor } from './isProposalAuthor';
import { isProposalReviewer } from './isProposalReviewer';
import { pfpStatusDiscussionEditableCommentable } from './pfpStatusDiscussionEditableCommentable';
import { pfpStatusDraftOnlyViewable } from './pfpStatusDraftOnlyViewable';
import { pfpStatusPrivateDraftVisibleOnlyByAuthor } from './pfpStatusPrivateDraftVisibleOnlyByAuthor';
import { pfpStatusReviewCommentable } from './pfpStatusReviewCommentable';
import { pfpStatusReviewedOnlyCreateVote } from './pfpStatusReviewedOnlyCreateVote';
import { pfpStatusVoteActiveOnlyVotable } from './pfpStatusVoteActiveOnlyVotable';
import { pfpStatusVoteClosedViewOnly } from './pfpStatusVoteClosedViewOnly';

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

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId
  });

  const permissions = new AvailableProposalPermissions();

  if (isAdmin) {
    return permissions.full;
  }

  if (!proposal.categoryId) {
    throw new InvalidInputError(`Cannot compute permissions for proposal ${resourceId} without category`);
  }

  const whereQuery: Prisma.ProposalCategoryPermissionWhereInput = {
    proposalCategoryId: proposal.categoryId
  };

  if (error || !userId) {
    whereQuery.public = true;
  } else {
    whereQuery.OR = [
      {
        public: true
      },
      {
        spaceId: proposal.spaceId
      },
      {
        role: {
          spaceRolesToRole: {
            some: {
              spaceRole: {
                userId
              }
            }
          }
        }
      }
    ];
  }

  const assignedPermissions = await prisma.proposalCategoryPermission.findMany({
    where: whereQuery
  });

  assignedPermissions.forEach((permission) => {
    permissions.addPermissions(proposalPermissionsMapping[permission.permissionLevel].slice());
  });

  if (isProposalAuthor({ proposal, userId })) {
    permissions.addPermissions(['edit', 'view', 'delete', 'vote', 'comment']);
  }

  const isReviewer = await isProposalReviewer({
    proposal,
    userId
  });
  if (isReviewer) {
    permissions.addPermissions(['view', 'comment', 'review']);
  }

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
  pfps: [
    pfpStatusPrivateDraftVisibleOnlyByAuthor,
    pfpStatusDraftOnlyViewable,
    pfpStatusDiscussionEditableCommentable,
    pfpStatusReviewCommentable,
    pfpStatusReviewedOnlyCreateVote,
    pfpStatusVoteActiveOnlyVotable,
    pfpStatusVoteClosedViewOnly
  ]
});

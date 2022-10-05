import type { ProposalStatus } from '@prisma/client';

import { prisma } from 'db';

import type { ProposalWithUsers } from './interface';
import type { ProposalUserGroup } from './proposalStatusTransition';
import { proposalStatusTransitionPermission } from './proposalStatusTransition';

export async function validateProposalStatusTransition ({
  proposal,
  newStatus,
  userId
}: {
  proposal: ProposalWithUsers;
  userId: string;
  newStatus: ProposalStatus;
}) {
  const reviewerUserIds: string[] = [];
  const reviewerRoleIds: string[] = [];

  proposal.reviewers.forEach(reviewer => {
    if (reviewer.userId) {
      reviewerUserIds.push(reviewer.userId);
    }
    else if (reviewer.roleId) {
      reviewerRoleIds.push(reviewer.roleId);
    }
  });

  let isCurrentUserProposalReviewer = reviewerUserIds.includes(userId);

  // Only check role if the user id doesn't match any of the reviewer id
  if (!isCurrentUserProposalReviewer) {
    const existingRole = await prisma.role.findFirst({
      where: {
        spaceId: proposal.spaceId,
        spaceRolesToRole: {
          some: {
            roleId: {
              in: reviewerRoleIds
            },
            spaceRole: {
              userId,
              spaceId: proposal.spaceId
            }
          }
        }
      }
    });
    isCurrentUserProposalReviewer = Boolean(existingRole);
  }

  const isCurrentUserProposalAuthor = proposal.authors.some(author => author.userId === userId);

  const proposalUserGroups: ProposalUserGroup[] = [];

  if (isCurrentUserProposalAuthor) {
    proposalUserGroups.push('author');
  }

  if (isCurrentUserProposalReviewer) {
    proposalUserGroups.push('reviewer');
  }

  let isUserAuthorizedToUpdateProposalStatus = false;

  // Check if the current user (if an author of proposal) has the permission to update the status
  if (!isUserAuthorizedToUpdateProposalStatus && proposalUserGroups.includes('author')) {
    isUserAuthorizedToUpdateProposalStatus = proposalStatusTransitionPermission[proposal.status]?.author?.includes(newStatus) ?? false;
  }

  // Check if the current user (if an review of proposal) has the permission to update the status (only if its not attainable via being author. A proposal author can be a reviewer as well)
  if (!isUserAuthorizedToUpdateProposalStatus && proposalUserGroups.includes('reviewer')) {
    isUserAuthorizedToUpdateProposalStatus = proposalStatusTransitionPermission[proposal.status]?.reviewer?.includes(newStatus) ?? false;
  }

  return isUserAuthorizedToUpdateProposalStatus;
}

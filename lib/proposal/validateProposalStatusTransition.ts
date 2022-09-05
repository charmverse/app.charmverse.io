import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { ProposalWithUsers } from './interface';
import { proposalStatusTransitionPermission } from './proposalStatusTransition';

export async function validateProposalStatusTransition ({
  proposal,
  newStatus,
  userId
}: {
  proposal: ProposalWithUsers,
  userId: string,
  newStatus: ProposalStatus
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
  const proposalUserGroup = isCurrentUserProposalAuthor ? 'author' : isCurrentUserProposalReviewer ? 'reviewer' : null;
  return proposalUserGroup !== null && (proposalStatusTransitionPermission[proposal.status]?.[proposalUserGroup]?.includes(newStatus));
}

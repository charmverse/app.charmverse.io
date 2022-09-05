import { ProposalAuthor, ProposalReviewer, ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { proposalStatusUserTransitionRecord } from './proposalStatusTransition';

export async function validateProposalStatusTransition ({
  currentStatus,
  newStatus,
  authors,
  reviewers,
  spaceId,
  userId
}: {
  newStatus: ProposalStatus,
  currentStatus: ProposalStatus,
  spaceId: string,
  userId: string
  authors: ProposalAuthor[],
  reviewers: ProposalReviewer[]
}) {
  const reviewerUserIds: string[] = [];
  const reviewerRoleIds: string[] = [];

  reviewers.forEach(reviewer => {
    if (reviewer.userId) {
      reviewerUserIds.push(reviewer.userId);
    }
    else if (reviewer.roleId) {
      reviewerRoleIds.push(reviewer.roleId);
    }
  });

  let isCurrentUserProposalReviewer = reviewerUserIds.includes(userId);

  if (!isCurrentUserProposalReviewer) {
    isCurrentUserProposalReviewer = Boolean((await prisma.role.findFirst({
      where: {
        spaceId,
        spaceRolesToRole: {
          some: {
            roleId: {
              in: reviewerRoleIds
            },
            spaceRole: {
              userId,
              spaceId
            }
          }
        }
      }
    })));
  }

  const isCurrentUserProposalAuthor = authors.some(author => author.userId === userId);
  const proposalUserGroup = isCurrentUserProposalAuthor ? 'author' : isCurrentUserProposalReviewer ? 'reviewer' : null;
  return proposalUserGroup !== null && (!proposalStatusUserTransitionRecord[currentStatus]?.[proposalUserGroup]?.includes(newStatus) ?? false);
}

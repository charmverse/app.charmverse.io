import { prisma } from 'db';

import type { ProposalResource } from './interfaces';

export async function isProposalReviewer({
  userId,
  proposal
}: {
  userId?: string;
  proposal: ProposalResource;
}): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const hasReviewerRoles = userId && proposal.reviewers.length > 0;
  // Skip this check if user is already admin
  if (hasReviewerRoles) {
    if (proposal.reviewers.some((r) => r.userId === userId)) {
      return true;
    } else if (proposal.reviewers.some((r) => !!r.roleId)) {
      const applicableRole = await prisma.spaceRoleToRole.findFirst({
        where: {
          roleId: {
            in: proposal.reviewers.filter((r) => !!r.roleId).map((r) => r.roleId as string)
          },
          spaceRole: {
            userId
          }
        }
      });

      return !!applicableRole;
    }
  }

  return false;
}

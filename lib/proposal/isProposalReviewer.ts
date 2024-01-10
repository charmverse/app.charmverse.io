import type { IsProposalReviewerFnInput } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

export async function isProposalReviewer({
  userId,
  proposal,
  checkRoles
}: IsProposalReviewerFnInput & { checkRoles?: boolean }): Promise<boolean> {
  const isUserReviewer = !!userId && proposal.reviewers.some((r) => r.userId === userId);

  if (isUserReviewer || !checkRoles) {
    return isUserReviewer;
  }

  const reviewerRoles = proposal.reviewers.filter((r) => !!r.roleId).map((r) => r.roleId as string);
  const applicableRole = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: {
        in: reviewerRoles
      },
      spaceRole: {
        userId
      }
    }
  });

  return !!applicableRole;
}

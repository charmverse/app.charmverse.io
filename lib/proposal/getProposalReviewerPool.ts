import { prisma } from '@charmverse/core';

export type ProposalReviewerPool = {
  space: boolean;
  roles: string[];
};
export async function getProposalReviewerPool({ spaceId }: { spaceId: string }): Promise<ProposalReviewerPool> {
  const reviewerPool: ProposalReviewerPool = {
    space: false,
    roles: []
  };

  const spacePermissions = await prisma.spacePermission.findMany({
    where: {
      forSpaceId: spaceId,
      operations: {
        has: 'reviewProposals'
      }
    }
  });

  if (spacePermissions.some((permission) => permission.spaceId === spaceId)) {
    reviewerPool.space = true;
  } else {
    spacePermissions.forEach((permission) => {
      if (permission.roleId) {
        reviewerPool.roles.push(permission.roleId);
      }
    });
  }

  return reviewerPool;
}

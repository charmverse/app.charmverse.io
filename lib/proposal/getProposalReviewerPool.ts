import { DataNotFoundError } from '@charmverse/core/errors';
import type { ProposalReviewerPool, Resource } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

export async function getProposalReviewerPool({ resourceId }: Resource): Promise<ProposalReviewerPool> {
  const category = await prisma.proposalCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!category) {
    throw new DataNotFoundError(`Proposal category with id ${resourceId} not found`);
  }

  const spaceId = category.spaceId;

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      userId: true
    }
  });

  return {
    userIds: spaceRoles.map((spaceRole) => spaceRole.userId),
    roleIds: []
  };
}

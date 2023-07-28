import { ProposalNotFoundError } from '@charmverse/core/errors';
import type { ProposalReviewerPool, Resource } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

export async function getProposalReviewerPool({ resourceId }: Resource): Promise<ProposalReviewerPool> {
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(resourceId);
  }

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: proposal.spaceId
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

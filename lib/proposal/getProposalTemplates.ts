import { InvalidInputError } from '@charmverse/core/errors';
import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { generateCategoryIdQuery } from '@charmverse/core/proposals';
import { stringUtils } from '@charmverse/core/utilities';

import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

export async function getProposalTemplates({ spaceId, userId }: SpaceResourcesRequest): Promise<ProposalWithUsers[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`SpaceID is required`);
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      paidTier: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return [];
  }

  let categoryIds: string[] | undefined;

  // If this is a paid space, we only want to provide the user with templates within categories where they can create a proposal
  if (space?.paidTier === 'pro' || space?.paidTier === 'enterprise') {
    const accessibleCategories = await premiumPermissionsApiClient.proposals
      .getAccessibleProposalCategories({
        spaceId,
        userId
      })
      .then((categories) => categories.filter((c) => c.permissions.create_proposal));

    if (accessibleCategories.length === 0) {
      return [];
    }

    categoryIds = accessibleCategories.map((c) => c.id);
  }

  return prisma.proposal.findMany({
    where: {
      spaceId,
      page: {
        type: 'proposal_template'
      },
      categoryId: generateCategoryIdQuery(categoryIds)
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });
}

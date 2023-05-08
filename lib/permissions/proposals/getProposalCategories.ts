import type { ProposalCategoryWithPermissions, SpaceResourcesRequest } from '@charmverse/core';
import { stringUtils, hasAccessToSpace, prisma } from '@charmverse/core';

import { InvalidInputError } from 'lib/utilities/errors';

import { buildProposalCategoryPermissions } from './computeProposalCategoryPermissions';

export async function getProposalCategories({
  spaceId,
  userId
}: SpaceResourcesRequest): Promise<ProposalCategoryWithPermissions[]> {
  if (!spaceId || !stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Cannot get accessible categories without a space id.`);
  }
  const categories = await prisma.proposalCategory.findMany({
    where: {
      spaceId
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  return categories.map((c) => ({ ...c, permissions: buildProposalCategoryPermissions({ spaceRole }) }));
}

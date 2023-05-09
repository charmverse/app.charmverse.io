import { prisma } from '@charmverse/core';

import { generateCategoryIdQuery } from 'lib/proposal/utils';
import { InvalidInputError } from 'lib/utilities/errors';

import { filterAccessibleProposalCategories } from './filterAccessibleProposalCategories';
import type { ProposalCategoryWithPermissions } from './interfaces';

type ListAccessibleCategoriesRequest = {
  userId?: string;
  categoryIds?: string[];
  spaceId: string;
};

export async function getAccessibleProposalCategories({
  userId,
  spaceId,
  categoryIds
}: ListAccessibleCategoriesRequest): Promise<ProposalCategoryWithPermissions[]> {
  if (!spaceId) {
    throw new InvalidInputError(`Cannot get accessible categories without a space id.`);
  }
  const categories = await prisma.proposalCategory.findMany({
    where: {
      spaceId,
      id: generateCategoryIdQuery(categoryIds)
    }
  });

  return filterAccessibleProposalCategories({ userId, proposalCategories: categories });
}

import type { Prisma } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

export const defaultProposalCategories = [
  'General',
  'Operational Budget',
  'Grants',
  'Investment',
  'Elections',
  'Governance'
];

export function generateDefaultProposalCategoriesInput(spaceId: string): Prisma.ProposalCategoryCreateManyInput[] {
  return defaultProposalCategories.map(
    (category) =>
      ({ title: category, color: getRandomThemeColor(), spaceId, id: v4() } as Prisma.ProposalCategoryCreateManyInput)
  );
}

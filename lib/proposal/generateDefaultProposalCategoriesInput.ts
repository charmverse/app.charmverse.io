import type { Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

export const defaultProposalCategories = [
  'Operational Budget',
  'Grants',
  'Investment',
  'Elections',
  'Governance',
  'Other'
];

export function generateDefaultProposalCategoriesInput(spaceId: string): Prisma.ProposalCategoryCreateManyInput[] {
  return defaultProposalCategories.map(
    (category) =>
      ({ title: category, color: getRandomThemeColor(), spaceId, id: v4() } as Prisma.ProposalCategoryCreateManyInput)
  );
}

import type { ProposalCategory } from '@charmverse/core/prisma';
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

export function generateDefaultProposalCategoriesInput(spaceId: string): ProposalCategory[] {
  return defaultProposalCategories.map((category) => ({
    title: category,
    color: getRandomThemeColor(),
    spaceId,
    id: v4()
  }));
}

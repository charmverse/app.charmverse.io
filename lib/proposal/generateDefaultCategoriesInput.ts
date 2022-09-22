import type { ProposalCategory } from 'lib/proposal/interface';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

const titles = [
  'Operational Budget',
  'Grants',
  'Investment',
  'Elections',
  'Governance',
  'Other'
];

export function generateDefaultCategoriesInput (spaceId: string): Omit<ProposalCategory, 'id'>[] {
  return titles.map(title => ({ title, color: getRandomThemeColor(), spaceId }));
}

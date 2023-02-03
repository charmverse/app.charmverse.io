import { v4 } from 'uuid';

import type { ProposalCategory } from 'lib/proposal/interface';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

const titles = ['Operational Budget', 'Grants', 'Investment', 'Elections', 'Governance', 'Other'];

export function generateDefaultCategoriesInput(spaceId: string): ProposalCategory[] {
  return titles.map((title) => ({ title, color: getRandomThemeColor(), spaceId, id: v4() }));
}

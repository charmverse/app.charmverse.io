import type { BuilderCardActivity } from '@charmverse/core/prisma-client';

import type { Last7DaysGems } from '../interfaces';

export function normalizeLast7DaysGems(
  builderCardActivity: Pick<BuilderCardActivity, 'last7Days'> | undefined
): number[] {
  return ((builderCardActivity?.last7Days as unknown as Last7DaysGems) || []).map((gem) => gem.gemsCount).slice(-7);
}

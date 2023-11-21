import { useCallback } from 'react';

import { usePages } from 'hooks/usePages';
import type { PagesMap } from 'lib/pages';

export function useRewardPage() {
  const { pages } = usePages();

  const getRewardPage = useCallback(
    (rewardId?: string | null) => {
      if (!rewardId) {
        return;
      }

      return findRewardPage(rewardId, pages);
    },
    [pages]
  );

  return { getRewardPage };
}

export function findRewardPage(rewardId: string | undefined, pages?: PagesMap) {
  if (!rewardId || !pages) {
    return;
  }

  return Object.values(pages).find((p) => p?.bountyId === rewardId);
}

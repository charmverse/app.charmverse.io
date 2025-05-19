import { defaultFreeBlockQuota } from '@packages/lib/subscription/constants';
import { useCallback } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useBlockCount } from 'components/settings/subscription/hooks/useBlockCount';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useSpaceSubscription() {
  const { space: currentSpace, refreshCurrentSpace } = useCurrentSpace();
  const { user } = useUser();
  const { count, additionalQuota } = useBlockCount();

  const { data: spaceSubscription } = useSWR(
    !!currentSpace?.id && !!user?.id ? `/spaces/${currentSpace.id}/subscription` : null,
    () => charmClient.subscription.getSpaceSubscription({ spaceId: currentSpace!.id }),
    { shouldRetryOnError: false }
  );

  const isSpaceReadonly = currentSpace?.subscriptionTier === 'readonly';

  const spaceBlockQuota = defaultFreeBlockQuota * 1000 + (spaceSubscription?.blockQuota || 0) * 1000 + additionalQuota;
  const hasPassedBlockQuota = (count || 0) > spaceBlockQuota;

  const downgradeToFreeTier = useCallback(async () => {
    await charmClient.subscription.downgradeSubscription(currentSpace!.id, {
      tier: 'free'
    });
    refreshCurrentSpace();
  }, [currentSpace, refreshCurrentSpace]);

  return {
    isSpaceReadonly,
    hasPassedBlockQuota,
    spaceBlockQuota,
    spaceBlockCount: count,
    paidTier: currentSpace?.paidTier,
    downgradeToFreeTier,
    isDowngradingToFreeTier: currentSpace?.subscriptionTier !== 'free',
    subscriptionTier: currentSpace?.subscriptionTier
  };
}

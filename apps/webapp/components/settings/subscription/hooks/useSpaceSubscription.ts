import { defaultFreeBlockQuota } from '@packages/lib/subscription/constants';
import { useCallback, useEffect, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useBlockCount } from 'components/settings/subscription/hooks/useBlockCount';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

export function useSpaceSubscription() {
  const { space: currentSpace, refreshCurrentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { setSpace } = useSpaces();
  const { user } = useUser();
  const { count, additionalQuota } = useBlockCount();

  const {
    data: spaceSubscription,
    isLoading,
    mutate: refetchSpaceSubscription
  } = useSWR(
    !!currentSpace?.id && !!user?.id ? `/spaces/${currentSpace.id}/subscription` : null,
    () => charmClient.subscription.getSpaceSubscription({ spaceId: currentSpace!.id }),
    { shouldRetryOnError: false }
  );

  const isSpaceReadonly = currentSpace?.subscriptionTier === 'readonly';

  const spaceBlockQuota = defaultFreeBlockQuota * 1000 + (spaceSubscription?.blockQuota || 0) * 1000 + additionalQuota;
  const hasPassedBlockQuota = (count || 0) > spaceBlockQuota;

  useEffect(() => {
    const unsubscribeFromSpaceSubscriptionUpdates = subscribe('space_subscription', (payload) => {
      refetchSpaceSubscription();
      if (currentSpace) {
        // TODO: Remove the condition below once we have a way to update the space subscription
        if (payload.paidTier) {
          setSpace({ ...currentSpace, paidTier: payload.paidTier });
        }
      }
    });

    return () => {
      unsubscribeFromSpaceSubscriptionUpdates();
    };
  }, [currentSpace]);

  const downgradeToFreeTier = useCallback(async () => {
    await charmClient.subscription.downgradeSubscription(currentSpace!.id, {
      tier: 'free'
    });
    refreshCurrentSpace();
  }, [currentSpace, refreshCurrentSpace]);

  return {
    spaceSubscription,
    isLoading,
    isSpaceReadonly,
    refetchSpaceSubscription,
    hasPassedBlockQuota,
    spaceBlockQuota,
    spaceBlockCount: count,
    paidTier: currentSpace?.paidTier,
    downgradeToFreeTier,
    isDowngradingToFreeTier: currentSpace?.subscriptionTier !== 'free',
    subscriptionTier: currentSpace?.subscriptionTier
  };
}

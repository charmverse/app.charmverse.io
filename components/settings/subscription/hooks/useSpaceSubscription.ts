import { useEffect, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import { getTimeDifference } from 'lib/utilities/dates';

export function useSpaceSubscription() {
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { setSpace } = useSpaces();
  const { user } = useUser();

  const {
    data: spaceSubscription,
    isLoading,
    mutate: refetchSpaceSubscription
  } = useSWR(
    !!currentSpace?.id && !!user?.id ? `/spaces/${currentSpace.id}/subscription` : null,
    () => charmClient.subscription.getSpaceSubscription({ spaceId: currentSpace!.id }),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );

  const freeTrialEnds = useMemo(
    () =>
      spaceSubscription?.status === 'free_trial'
        ? getTimeDifference(spaceSubscription?.expiresOn ?? new Date(), 'day', new Date())
        : 0,
    [spaceSubscription?.status, spaceSubscription?.expiresOn]
  );

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

  return {
    spaceSubscription,
    isLoading,
    freeTrialEnds,
    refetchSpaceSubscription
  };
}

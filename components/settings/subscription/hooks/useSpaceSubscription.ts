import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

export function useSpaceSubscription() {
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { setSpace } = useSpaces();

  const {
    data: spaceSubscription,
    isLoading,
    mutate: refetchSpaceSubscription
  } = useSWR(
    currentSpace ? `${currentSpace.id}-subscription` : null,
    () => charmClient.subscription.getSpaceSubscription({ spaceId: currentSpace!.id }),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
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
    refetchSpaceSubscription
  };
}

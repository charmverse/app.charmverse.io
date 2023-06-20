import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

export function useSpaceSubscription() {
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();

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
    const unsubscribeFromSpaceSubscriptionUpdates = subscribe('space_subscription', () => {
      refetchSpaceSubscription();
    });

    return () => {
      unsubscribeFromSpaceSubscriptionUpdates();
    };
  }, []);

  return {
    spaceSubscription,
    isLoading,
    refetchSpaceSubscription
  };
}

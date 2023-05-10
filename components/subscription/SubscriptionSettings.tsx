import type { Space } from '@charmverse/core/prisma';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';

export function SubscriptionSettings({ space }: { space: Space }) {
  const { data = null, isLoading } = useSWR(`${space.id}-subscription`, () => {
    return charmClient.payment.getSpaceSubscription({ spaceId: space.id });
  });

  if (data === null || isLoading) {
    return <LoadingComponent label='Fetching your space subscription' />;
  }

  return null;
}

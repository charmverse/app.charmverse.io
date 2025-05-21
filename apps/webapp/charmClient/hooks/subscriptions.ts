import type { Space } from '@charmverse/core/prisma';
import type { SpaceSubscriptionStatus } from '@packages/subscriptions/getSubscriptionStatus';
import type { SWRMutationConfiguration } from 'swr/mutation';

import type { MaybeString } from './helpers';
import { useGET, usePOST } from './helpers';

export function useGetSubscriptionStatus(spaceId: MaybeString) {
  return useGET<SpaceSubscriptionStatus>(spaceId ? `/api/spaces/${spaceId}/subscriptions/status` : null, {
    spaceId
  });
}

export function useSwitchToFreeTier(
  spaceId: MaybeString,
  options?: SWRMutationConfiguration<Space, Error, string, void>
) {
  return usePOST(`/api/spaces/${spaceId}/switch-to-free-tier`, options);
}

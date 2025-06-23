import type { SpaceResult, GetSpacesFilter } from 'lib/admin/getSpaces';
import type { UpdateSpaceBody } from 'pages/api/admin/spaces';
import type { ClientSpaceTokenBalance } from 'pages/api/admin/token-balance';

import type { MaybeString } from './helpers';
import { useGET, useGETImmutable, usePUT } from './helpers';

export function useAdminSpaces({ name, sortField, sortDirection, subscriptionTier }: GetSpacesFilter) {
  return useGETImmutable<SpaceResult[]>('/api/admin/spaces', {
    name,
    sortField,
    sortDirection,
    subscriptionTier
  });
}

export function useUpdateSpace() {
  return usePUT<UpdateSpaceBody>(`/api/admin/spaces`);
}

export function useGetSpaceTokenBalance(spaceId: MaybeString) {
  return useGET<ClientSpaceTokenBalance>(spaceId ? `/api/admin/token-balance` : null, {
    id: spaceId
  });
}

import type { SpaceResult, GetSpacesFilter } from 'lib/admin/getSpaces';
import type { UpdateSpaceBody } from 'pages/api/admin/spaces';

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
  return useGET<{ value: string; formatted: number }>(spaceId ? `/api/admin/token-balance` : null, {
    id: spaceId
  });
}

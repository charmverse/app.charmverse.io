import type { SpaceResult, GetSpacesFilter } from 'lib/admin/getSpaces';

import { useGET, useGETImmutable } from './helpers';

export function useAdminSpaces({ name, sortField, sortDirection, subscriptionTier }: GetSpacesFilter) {
  return useGETImmutable<SpaceResult[]>('/api/admin/spaces', {
    name,
    sortField,
    sortDirection,
    subscriptionTier
  });
}

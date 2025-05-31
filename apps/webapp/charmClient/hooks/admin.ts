import type { SpaceResult, GetSpacesFilter } from 'lib/admin/getSpaces';

import { useGET, useGETImmutable } from './helpers';

export function useAdminSpaces({ name }: GetSpacesFilter) {
  return useGETImmutable<SpaceResult[]>('/api/admin/spaces', {
    name
  });
}

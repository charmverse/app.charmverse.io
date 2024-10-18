import type { ScoutGameUser, UserFilter } from 'lib/users/getUsers';

import { useGETImmutable, usePOST } from './helpers';

export function useSearchUsers(searchString?: string, filter?: UserFilter) {
  return useGETImmutable<ScoutGameUser[]>(searchString ? '/api/users' : null, { searchString, filter });
}

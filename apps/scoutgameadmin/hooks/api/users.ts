import type { SearchUserResult } from 'lib/users/getUser';
import type { ScoutGameUser, SortField, SortOrder, UserFilter } from 'lib/users/getUsers';

import { useGETImmutable, usePOST } from './helpers';

export function useSearchUsers({
  searchString,
  sortField,
  sortOrder,
  filter
}: {
  searchString?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  filter?: UserFilter;
}) {
  return useGETImmutable<ScoutGameUser[]>(searchString || sortField || filter ? '/api/users' : null, {
    searchString,
    sortField,
    sortOrder,
    filter
  });
}

export function useGetUser(searchString?: string) {
  return useGETImmutable<SearchUserResult | null>(searchString ? '/api/users/get-user' : null, { searchString });
}

export function useCreateUser() {
  return usePOST<{ searchString: string }>('/api/users');
}

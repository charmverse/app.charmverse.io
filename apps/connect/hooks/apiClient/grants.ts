import type { GetGrantsResponse } from '@connect-shared/lib/grants/getGrants';
import { useGETtrigger } from '@root/charmClient/hooks/helpers';

export function useGetGrantsList() {
  return useGETtrigger<{ sort: string; cursor: string; limit: number }, GetGrantsResponse>('/api/grants');
}

import { useGETtrigger } from '@root/charmClient/hooks/helpers';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';

export function useSearchByUsername() {
  return useGETtrigger<{ name: string }, FarcasterUser[]>('/api/farcaster/search-by-username');
}

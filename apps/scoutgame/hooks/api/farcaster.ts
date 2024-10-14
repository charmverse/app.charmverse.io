import type { FarcasterUser } from '@packages/farcaster/interfaces';

import { useGETImmutable } from './helpers';

export function useGetFarcasterUser({ userId }: { userId: string }) {
  return useGETImmutable<FarcasterUser | null>('/api/farcaster/user', {
    userId
  });
}

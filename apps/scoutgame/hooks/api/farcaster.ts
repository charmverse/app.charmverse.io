import type { FarcasterUser } from '@packages/farcaster/interfaces';
import { useGETImmutable } from '@packages/scoutgame/hooks/helpers';

export function useGetFarcasterUser({ userId }: { userId: string }) {
  return useGETImmutable<FarcasterUser | null>('/api/farcaster/user', {
    userId
  });
}

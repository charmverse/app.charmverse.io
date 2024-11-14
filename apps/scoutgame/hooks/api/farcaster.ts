import type { FarcasterUser } from '@packages/farcaster/interfaces';
import { useGETImmutable } from '@packages/scoutgame-ui/hooks/helpers';

export function useGetFarcasterUser({ userId }: { userId: string }) {
  return useGETImmutable<FarcasterUser | null>('/api/farcaster/user', {
    userId
  });
}

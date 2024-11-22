import { useGETImmutable, usePOST } from '@packages/scoutgame-ui/hooks/helpers';
import type { WebAppInitData } from '@twa-dev/types';

export function useGetClaimablePoints() {
  return useGETImmutable<{ points: number }>(
    '/api/session/claimable-points',
    {},
    {
      refreshInterval: 30000
    }
  );
}

export function useInitTelegramUser() {
  return usePOST<{ initData: string }, WebAppInitData>('/api/session/telegram-user');
}

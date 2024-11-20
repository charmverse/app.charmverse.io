import { useGETImmutable, usePOST } from '@packages/scoutgame-ui/hooks/helpers';

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
  return usePOST<{ initData: string }, { id: string }>('/api/session/telegram-user');
}

import { useGETImmutable, usePOST } from '@packages/scoutgame-ui/hooks/helpers';
import type { WebAppInitData } from '@twa-dev/types';

export function useInitTelegramUser() {
  return usePOST<{ initData: string }, WebAppInitData>('/api/session/telegram-user');
}

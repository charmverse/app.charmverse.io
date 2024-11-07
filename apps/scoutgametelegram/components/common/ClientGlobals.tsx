'use client';

import { useDatadogLogger } from 'hooks/useDatadogLogger';
import { useInitTelegramData } from 'hooks/useInitTelegramData';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-telegramapp-browser', userId });
  useInitTelegramData();

  return null;
}

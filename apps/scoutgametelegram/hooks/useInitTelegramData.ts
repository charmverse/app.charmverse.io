import { log } from '@charmverse/core/log';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import WebApp from '@twa-dev/sdk';
import { useEffect } from 'react';

import { useInitTelegramUser } from './api/session';

export function useInitTelegramData() {
  const initData = typeof window !== 'undefined' ? WebApp.initData : null;
  const { trigger, isMutating } = useInitTelegramUser();
  const { refreshUser, isLoading } = useUser();

  useEffect(() => {
    // Load the Telegram Web App SDK
    if (typeof window !== 'undefined') {
      WebApp.ready();
    }
  }, []);

  useEffect(() => {
    if (initData) {
      trigger(
        { initData },
        {
          onSuccess: async (data) => {
            if (data) {
              await refreshUser();
            }
          },
          onError: (error) => {
            log.error('Error loading telegram user', { error });
          }
        }
      );
    }
  }, [initData]);

  return { isLoading: isMutating || isLoading, initData };
}

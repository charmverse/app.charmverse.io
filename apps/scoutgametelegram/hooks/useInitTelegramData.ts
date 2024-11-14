/* eslint-disable import/no-extraneous-dependencies */
import { log } from '@charmverse/core/log';
import { useIsMounted } from '@packages/scoutgame-ui/hooks/useIsMounted';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import WebApp from '@twa-dev/sdk';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { loadUser } from 'lib/session/loadUserAction';

export function useInitTelegramData() {
  const telegramInitData = typeof window !== 'undefined' ? WebApp.initData : null;
  const isMounted = useIsMounted();
  const { refreshUser, isLoading } = useUser();
  const { executeAsync, isExecuting } = useAction(loadUser, {
    onSuccess: async (data) => {
      if (data.data) {
        await refreshUser();
      }
    },
    onError: (error) => {
      log.error('Error loading user', { error: error.error.serverError });
    }
  });

  useEffect(() => {
    // Load the Telegram Web App SDK
    if (isMounted && typeof window !== 'undefined') {
      WebApp.ready();
    }
  }, [isMounted]);

  useEffect(() => {
    if (telegramInitData) {
      executeAsync({ initData: telegramInitData });
    }
  }, [telegramInitData]);

  return { isLoading: isExecuting || isLoading, initData: telegramInitData };
}

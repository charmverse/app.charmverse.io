import { log } from '@charmverse/core/log';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useInitTelegramUser } from './api/session';

export function useInitTelegramData() {
  const initData = typeof window !== 'undefined' ? WebApp.initData : null;
  const { trigger, isMutating } = useInitTelegramUser();
  const { refreshUser, isLoading } = useUser();
  const router = useRouter();

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
              const param = data.start_param;
              if (param && param.startsWith('page_')) {
                const redirectUrl = param.replace('page_', '/').trim();
                router.push(redirectUrl);
              } else {
                router.push('/welcome');
              }
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

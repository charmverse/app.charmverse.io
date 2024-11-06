/* eslint-disable import/no-extraneous-dependencies */
import WebApp from '@twa-dev/sdk';
import { redirect } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { useUser } from 'components/layout/UserProvider';
import { useIsMounted } from 'hooks/useIsMounted';
import { loadUser } from 'lib/session/loadUserAction';

export function useInitTelegramData() {
  const telegramInitData = WebApp.initData;
  const isMounted = useIsMounted();
  const { refreshUser, isLoading } = useUser();
  const { executeAsync, isExecuting } = useAction(loadUser, {
    onSuccess: async (data) => {
      if (data) {
        await refreshUser(data.data);
        // @TODO: Enable this when we will have an onboarding page
        // if (data.data?.onboardedAt) {
        //   redirect('/home');
        // } else {
        //   redirect('/welcome/onboarding');
        // }
      }
    }
  });

  useEffect(() => {
    // Load the Telegram Web App SDK
    if (isMounted) {
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

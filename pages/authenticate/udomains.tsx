import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { useUnstoppableDomains } from 'hooks/useUnstoppableDomains';
import type { UdomainsPopupLoginState } from 'lib/oauth/interfaces';

export default function Oauth() {
  const { unstoppableDomainsRedirectLogin, loginCallback } = useUnstoppableDomains();
  const router = useRouter();
  const action: string | null = (router.query.action as string) || (router.asPath.includes('code') ? 'callback' : null);
  const [loginState, setLoginState] = useState<UdomainsPopupLoginState | null>(null);

  async function getCredentials() {
    try {
      const authSig = await loginCallback();
      setLoginState({ status: 'success', authSig });
    } catch (e: any) {
      setLoginState({ status: 'error', error: e.message || 'Failed to login with unstoppable domains' });
    }
  }

  useEffect(() => {
    if (!action) return;

    if (action === 'login') {
      unstoppableDomainsRedirectLogin();
    } else if (action === 'callback') {
      getCredentials();
    }
  }, [router.query.action]);

  useEffect(() => {
    if (!loginState) return;

    const listener = (event: MessageEvent<any>) => {
      if (event.source && event.origin) {
        const message: UdomainsPopupLoginState = loginState;
        event.source.postMessage(message, { targetOrigin: event.origin });
      }
    };

    window.addEventListener('message', listener);

    return () => window.removeEventListener('message', listener);
  }, [loginState]);

  return (
    <Box height='100vh' width='100vw' display='flex' alignItems='center' justifyContent='center'>
      <LoadingComponent isLoading />
    </Box>
  );
}

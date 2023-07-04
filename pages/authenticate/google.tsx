import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import type { GooglePopupLoginState } from 'lib/oauth/interfaces';

export default function Oauth() {
  const { getGoogleTokenWithRedirect, getGoogleRedirectResult } = useFirebaseAuth();
  const router = useRouter();
  const [initLogin, setInitLogin] = useState(false);
  const action = router.query.action;
  const [loginState, setLoginState] = useState<GooglePopupLoginState | null>(null);

  async function getGoogleCredentials() {
    try {
      const googleToken = await getGoogleRedirectResult();
      setLoginState({ status: 'success', googleToken });
    } catch (e: any) {
      setLoginState({ status: 'error', error: e.message || 'Failed to login with google' });
    }
  }

  useEffect(() => {
    if (action === 'login') {
      setInitLogin(true);
      const query = router.query;
      query.action = 'callback';

      router.replace({
        query
      });
    }
  }, [router.query.action]);

  useEffect(() => {
    if (action !== 'callback') return;

    if (initLogin) {
      getGoogleTokenWithRedirect();
    } else {
      getGoogleCredentials();
    }
  }, [initLogin, action]);

  useEffect(() => {
    if (!loginState) return;

    const listener = (event: MessageEvent<any>) => {
      if (event.source && event.origin) {
        const message: GooglePopupLoginState = loginState;
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

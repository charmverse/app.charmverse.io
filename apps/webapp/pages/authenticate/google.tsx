import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { googleSignInScript, useGoogleLogin } from 'hooks/useGoogleLogin';
import type { GooglePopupLoginState } from '@packages/lib/oauth/interfaces';

export default function Oauth() {
  const { onLoadScript, loginWithGoogleRedirect, isLoaded } = useGoogleLogin();

  const router = useRouter();
  const action: string | null =
    (router.query.action as string) || (router.query.code || router.query.error ? 'callback' : null);
  const [loginState, setLoginState] = useState<GooglePopupLoginState | null>(null);

  async function getGoogleCredentials() {
    const { code } = router.query;

    if (router.query.code && typeof code === 'string') {
      setLoginState({ status: 'success', code });
    } else {
      setLoginState({ status: 'error', error: 'Failed to login with google' });
    }
  }

  useEffect(() => {
    if (!action) return;

    if (action === 'login' && isLoaded) {
      loginWithGoogleRedirect();
    } else if (action === 'callback') {
      getGoogleCredentials();
    }
  }, [action, isLoaded]);

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
      <Script src={googleSignInScript} onReady={onLoadScript} />
      <LoadingComponent isLoading />
    </Box>
  );
}

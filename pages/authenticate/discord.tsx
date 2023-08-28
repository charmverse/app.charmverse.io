import Box from '@mui/material/Box';
import { useEffect } from 'react';

import { getLayout } from 'components/common/BaseLayout/getLayout';
import LoadingComponent from 'components/common/LoadingComponent';
import type { OauthLoginState } from 'lib/oauth/interfaces';

export default function Oauth() {
  useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      if (event.source && event.origin) {
        const code = new URLSearchParams(window.location.search).get('code');
        const message: OauthLoginState<{ code: string | null }> = {
          status: code ? 'success' : 'error',
          code
        };

        event.source.postMessage(message, { targetOrigin: event.origin });
      }
    };

    window.addEventListener('message', listener);

    return () => window.removeEventListener('message', listener);
  }, []);

  return getLayout(
    <Box height='100vh' width='100vw' display='flex' alignItems='center' justifyContent='center'>
      <LoadingComponent isLoading />
    </Box>
  );
}

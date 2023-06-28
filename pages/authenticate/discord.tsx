import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import getLayout from 'components/common/BaseLayout/BaseLayout';
import { LoginPageContent } from 'components/login';
import type { PopupLoginState } from 'hooks/usePopupLogin';

export default function Oauth() {
  useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      if (event.source && event.origin) {
        const code = new URLSearchParams(window.location.search).get('code');
        const message: PopupLoginState & { code: string | null } = {
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
    <Box height='100%' display='flex' flexDirection='column'>
      <LoginPageContent hideLoginOptions isLoggingIn />
    </Box>
  );
}

import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import getLayout from 'components/common/BaseLayout/BaseLayout';
import ErrorPage from 'components/common/errors/ErrorPage';
import { LoginPageContent } from 'components/login';

export default function Oauth() {
  const router = useRouter();
  const { error } = router.query;

  useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      if (event.source && event.origin) {
        event.source.postMessage(
          {
            success: true,
            code: new URLSearchParams(window.location.search).get('code')
          },
          { targetOrigin: event.origin }
        );
      }
    };

    window.addEventListener('message', listener);

    return () => window.removeEventListener('message', listener);
  }, []);

  if (error) {
    return <ErrorPage message={typeof error === 'string' ? error : 'Failed to login with discord'}></ErrorPage>;
  }

  return getLayout(
    <Box height='100%' display='flex' flexDirection='column'>
      <LoginPageContent hideLoginOptions isLoggingIn />
    </Box>
  );
}

'use client';

import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { AuthKitProvider, SignInButton, useProfile } from '@farcaster/auth-kit';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { ConnectApiClient } from 'apiClient/apiClient';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import useSWRMutation from 'swr/mutation';

import '@farcaster/auth-kit/styles.css';

import { warpcastConfig } from 'lib/farcaster/config';

function WarpcastLoginButton() {
  const router = useRouter();
  const { isAuthenticated } = useProfile();

  const { trigger, error } = useSWRMutation('login', (_, { arg }: { arg: StatusAPIResponse }) => {
    const connectApiClient = new ConnectApiClient();
    return connectApiClient.loginViaFarcaster(arg);
  });

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    trigger(res, {
      onSuccess: (user) => {
        revalidatePathAction();
        log.info('User logged in', { userId: user.id });
        router.push('/profile');
      },
      onError: (err) => {
        log.error('Server error while logging in with Warpcast', { error: err });
      }
    });
  }, []);

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    log.error('There was an error while logging in with Warpcast', { error: err });
  }, []);

  if (isAuthenticated) {
    return null;
  }

  return (
    <Box
      width='100%'
      data-test='connect-with-farcaster'
      sx={{
        '.fc-authkit-signin-button': {
          button: {
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            mx: 'auto'
          }
        }
      }}
    >
      <SignInButton onSuccess={onSuccessCallback} onError={onErrorCallback} hideSignOut />
      {error?.message && <Typography variant='body2'>There was an error while logging in</Typography>}
    </Box>
  );
}

export function WarpcastLogin() {
  return (
    <AuthKitProvider config={warpcastConfig}>
      <WarpcastLoginButton />
    </AuthKitProvider>
  );
}

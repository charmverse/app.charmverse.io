'use client';

import { log } from '@charmverse/core/log';
import { AuthKitProvider, SignInButton } from '@farcaster/auth-kit';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import { ConnectApiClient } from 'apiClient/apiClient';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import '@farcaster/auth-kit/styles.css';

import { actionRevalidatePath } from 'lib/actions/revalidatePath';
import { warpcastConfig } from 'lib/farcaster/config';

function WarpcastLoginButton() {
  const router = useRouter();

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    const connectApiClient = new ConnectApiClient();
    await connectApiClient.loginViaFarcaster(res).catch((error) => {
      log.error('There was an error on the server while logging in with Warpcast', { error });
    });
    await actionRevalidatePath();
    router.push('/profile');
  }, []);

  const onErrorCallback = useCallback((error?: AuthClientError) => {
    log.error('There was an error while logging in with Warpcast', { error });
  }, []);

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

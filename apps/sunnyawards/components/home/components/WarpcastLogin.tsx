'use client';

import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { loginWithFarcasterAction } from '@connect-shared/lib/session/loginAction';
import { AuthKitProvider, SignInButton, useProfile } from '@farcaster/auth-kit';
import type { AuthClientError } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { warpcastConfig } from '@root/lib/farcaster/config';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import '@farcaster/auth-kit/styles.css';

function WarpcastLoginButton() {
  const router = useRouter();
  const { isAuthenticated } = useProfile();

  const { execute: loginUser, hasErrored } = useAction(loginWithFarcasterAction, {
    onSuccess: async () => {
      revalidatePathAction();
      router.push('/profile');
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  const onErrorCallback = useCallback((error?: AuthClientError) => {
    log.error('There was an error while logging in with Warpcast', { error });
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
      <SignInButton onSuccess={loginUser} onError={onErrorCallback} hideSignOut />
      {hasErrored && <Typography variant='body2'>There was an error while logging in</Typography>}
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

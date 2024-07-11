'use client';

import { log } from '@charmverse/core/log';
import { AuthKitProvider, SignInButton } from '@farcaster/auth-kit';
import type { AuthClientError } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import { warpcastConfig } from '@root/lib/farcaster/config';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { actionRevalidatePath } from 'lib/actions/revalidatePath';
import { loginWithFarcasterAction } from 'lib/session/loginAction';

import '@farcaster/auth-kit/styles.css';

function WarpcastLoginButton() {
  const router = useRouter();

  const { execute: loginUser } = useAction(loginWithFarcasterAction, {
    onSuccess: async () => {
      await actionRevalidatePath({});
      router.push('/profile');
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

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
      <SignInButton onSuccess={loginUser} onError={onErrorCallback} hideSignOut />
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

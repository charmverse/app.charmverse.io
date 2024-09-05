'use client';

import { log } from '@charmverse/core/log';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { AuthKitProvider, SignInButton, useProfile } from '@farcaster/auth-kit';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import '@farcaster/auth-kit/styles.css';
import { authConfig } from 'lib/farcaster/config';
import { loginAction } from 'lib/session/loginWithFarcasterAction';

function WarpcastLoginButton() {
  const router = useRouter();
  const { isAuthenticated } = useProfile();

  const {
    executeAsync: revalidatePath,
    hasSucceeded: revalidatePathSuccess,
    isExecuting: isRevalidatingPath
  } = useAction(revalidatePathAction);

  const {
    executeAsync: loginUser,
    hasErrored,
    hasSucceeded: loginWithFarcasterSuccess,
    isExecuting: isLoggingIn
  } = useAction(loginAction, {
    onSuccess: async () => {
      await revalidatePath();
      router.push('/profile');
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    if (res.message && res.signature) {
      await loginUser({ message: res.message!, nonce: res.nonce, signature: res.signature! });
    } else {
      log.error('Did not receive message or signature from farcaster', res);
    }
  }, []);

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    log.error('There was an error while logging in with Warpcast', { error: err });
  }, []);

  if (isLoggingIn || isRevalidatingPath || (isAuthenticated && loginWithFarcasterSuccess && revalidatePathSuccess)) {
    return <LoadingComponent size={30} label='Logging you in...' />;
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
      {hasErrored && (
        <Typography variant='body2' sx={{ mt: 2 }} color='error'>
          There was an error while logging in
        </Typography>
      )}
    </Box>
  );
}

export function WarpcastLogin() {
  return (
    <AuthKitProvider config={authConfig}>
      <WarpcastLoginButton />
    </AuthKitProvider>
  );
}

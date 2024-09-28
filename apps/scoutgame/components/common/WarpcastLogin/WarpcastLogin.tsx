'use client';

import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { AuthKitProvider, SignInButton, useProfile } from '@farcaster/auth-kit';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import { Box, Link, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import '@farcaster/auth-kit/styles.css';
import { LoadingComponent } from 'components/common/Loading/LoadingComponent';
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
    hasSucceeded: loginWithFarcasterSuccess
  } = useAction(loginAction, {
    onSuccess: async ({ data }) => {
      const nextPage = data?.onboarded ? '/' : '/welcome';
      await revalidatePath();
      router.push(nextPage);
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    if (res.message && res.signature) {
      try {
        await loginUser({ message: res.message!, nonce: res.nonce, signature: res.signature! });
      } catch (error) {
        log.error('Error logging in after sign-in with with Warpcast', { error });
      }
    } else {
      log.error('Did not receive message or signature from Farcaster', res);
    }
  }, []);

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    if (err?.errCode === 'unavailable') {
      log.warn('Timed out waiting for Warpcast login', { error: err });
    } else {
      log.error('There was an error while logging in with Warpcast', { error: err });
    }
  }, []);

  if (isRevalidatingPath || (isAuthenticated && loginWithFarcasterSuccess && revalidatePathSuccess)) {
    return (
      <Box height={47}>
        <LoadingComponent size={30} label='Logging you in...' />
      </Box>
    );
  }

  return (
    <Box width='100%' data-test='connect-with-farcaster'>
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
      <Link href='https://www.farcaster.xyz/' target='_blank' rel='noopener' fontWeight={500} display='block'>
        Join Farcaster
      </Link>
    </AuthKitProvider>
  );
}

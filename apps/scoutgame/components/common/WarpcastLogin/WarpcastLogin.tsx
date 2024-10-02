'use client';

import { log } from '@charmverse/core/log';
import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { AuthKitProvider, useProfile } from '@farcaster/auth-kit';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import type { ButtonProps } from '@mui/material';
import { Box, Button, Link, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { LoadingComponent } from 'components/common/Loading/LoadingComponent';
import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { authConfig } from 'lib/farcaster/config';
import { loginAction } from 'lib/session/loginWithFarcasterAction';

import { FarcasterLoginModal } from './FarcasterModal';
import { WarpcastIcon } from './WarpcastIcon';

function WarpcastLoginButton({ children, ...props }: ButtonProps) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'warpcast-login' });
  const router = useRouter();
  const { isAuthenticated } = useProfile();
  const searchParams = useSearchParams();
  const redirectUrlEncoded = searchParams.get('redirectUrl');
  const redirectUrl = redirectUrlEncoded ? decodeURIComponent(redirectUrlEncoded) : '/';

  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);

  const {
    executeAsync: loginUser,
    hasErrored,
    isExecuting: isLoggingIn,
    result
  } = useAction(loginAction, {
    onSuccess: async ({ data }) => {
      const nextPage = data?.onboarded ? redirectUrl : '/welcome';

      if (!data?.success) {
        return;
      }

      await revalidatePath();
      router.push(nextPage);

      popupState.close();
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
      popupState.close();
    }
  });

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    if (err?.errCode === 'unavailable') {
      log.warn('Timed out waiting for Warpcast login', { error: err });
    } else {
      log.error('There was an error while logging in with Warpcast', { error: err });
    }
    popupState.close();
  }, []);

  const onSuccessCallback = useCallback(async (res: StatusAPIResponse) => {
    if (res.message && res.signature) {
      await loginUser({ message: res.message!, nonce: res.nonce, signature: res.signature });
    } else {
      log.error('Did not receive message or signature from Farcaster', res);
    }
  }, []);

  const onClick = useCallback(() => {
    popupState.open();
  }, []);

  const { signIn, url } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick
  });

  if (isAuthenticated && (isRevalidatingPath || isLoggingIn)) {
    return (
      <Box height={47}>
        <LoadingComponent size={30} label='Logging you in...' />
      </Box>
    );
  }

  const errorMessage = result?.serverError?.message?.includes('private beta')
    ? 'Scout Game is in private beta'
    : 'There was an error while logging in';

  return (
    <Box width='100%' data-test='connect-with-farcaster'>
      <Button
        size='large'
        onClick={signIn}
        disabled={!url}
        sx={{ px: 4, py: 2 }}
        startIcon={<WarpcastIcon />}
        {...props}
      >
        {children || 'Sign in with Warpcast'}
      </Button>
      {hasErrored && (
        <Typography variant='body2' sx={{ mt: 2 }} color='error'>
          {errorMessage}
        </Typography>
      )}
      <FarcasterLoginModal open={popupState.isOpen} onClose={() => popupState.close()} url={url} />
    </Box>
  );
}

export function WarpcastLogin() {
  const trackEvent = useTrackEvent();

  return (
    <AuthKitProvider config={authConfig}>
      <WarpcastLoginButton />
      <Link
        href='https://www.farcaster.xyz/'
        target='_blank'
        rel='noopener'
        fontWeight={500}
        display='block'
        onMouseDown={() => {
          trackEvent('click_dont_have_farcaster_account');
        }}
      >
        Join Farcaster
      </Link>
    </AuthKitProvider>
  );
}

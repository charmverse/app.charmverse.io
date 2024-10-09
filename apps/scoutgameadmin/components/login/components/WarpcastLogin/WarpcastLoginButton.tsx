'use client';

import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { useProfile } from '@farcaster/auth-kit';
import type { StatusAPIResponse, AuthClientError } from '@farcaster/auth-kit';
import { LoadingButton } from '@mui/lab';
import type { ButtonProps } from '@mui/material';
import { Box, Button, Typography } from '@mui/material';
import { useFarcasterConnection } from '@packages/farcaster/hooks/useFarcasterConnection';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { loginAction } from 'lib/session/loginWithFarcasterAction';

import { FarcasterLoginModal } from './FarcasterModal';
import { WarpcastIcon } from './WarpcastIcon';

export function WarpcastLoginButton({ children, ...props }: ButtonProps) {
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
      const nextPage = '/';

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

  return (
    <Box width='100%' data-test='connect-with-farcaster'>
      <LoadingButton
        loading={isRevalidatingPath || isLoggingIn}
        size='large'
        variant='contained'
        color='primary'
        onClick={signIn}
        disabled={!url}
        sx={{
          px: {
            xs: 2.5,
            md: 4
          },
          py: {
            xs: 1.5,
            md: 2
          }
        }}
        startIcon={<WarpcastIcon />}
        {...props}
      >
        {children || 'Sign in with Warpcast'}
      </LoadingButton>
      {hasErrored && (
        <Typography variant='body2' sx={{ mt: 2 }} color='error'>
          {result?.serverError?.message}
        </Typography>
      )}
      <FarcasterLoginModal open={popupState.isOpen} onClose={() => popupState.close()} url={url} />
    </Box>
  );
}

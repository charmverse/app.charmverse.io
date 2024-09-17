'use client';

import { log } from '@charmverse/core/log';
import { FarcasterLoginModal } from '@connect-shared/components/common/FarcasterModal';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { loginWithFarcasterAction } from '@connect-shared/lib/session/loginAction';
import { AuthKitProvider, useProfile } from '@farcaster/auth-kit';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { warpcastConfig } from '@root/lib/farcaster/config';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { useFarcasterConnection } from 'hooks/useFarcasterConnection';

import { WarpcastIcon } from './WarpcastIcon';

function WarpcastLoginButton({ children, ...props }: ButtonProps) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'warpcast-login' });
  const router = useRouter();
  const { isAuthenticated } = useProfile();

  const {
    execute: loginUser,
    hasErrored,
    hasSucceeded,
    isExecuting
  } = useAction(loginWithFarcasterAction, {
    onSuccess: async ({ data }) => {
      revalidatePathAction();
      router.push('/profile');
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  const onSuccessCallback = useCallback(async (data: StatusAPIResponse) => {
    await loginUser(data);
    popupState.close();
  }, []);

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    log.error('There was an error while logging in with Warpcast', { error: err });
    popupState.close();
  }, []);

  const onClick = useCallback(() => {
    popupState.open();
  }, []);

  const { signIn, url } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick
  });

  if (isExecuting || (isAuthenticated && hasSucceeded)) {
    return <LoadingComponent size={30} label='Logging you in...' />;
  }

  return (
    <Box data-test='connect-with-farcaster'>
      <Button
        size='large'
        onClick={signIn}
        disabled={!url}
        sx={(theme) => ({
          fontSize: '18px',
          bgcolor: theme.palette.farcaster.main,
          color: theme.palette.text.primary,
          '&:hover': { background: theme.palette.farcaster.dark, color: theme.palette.text.primary }
        })}
        startIcon={<WarpcastIcon />}
        {...props}
      >
        {children || 'Sign in with Warpcast'}
      </Button>
      <FarcasterLoginModal open={popupState.isOpen} onClose={() => popupState.close()} url={url} />
      {hasErrored && <Typography variant='body2'>There was an error while logging in</Typography>}
    </Box>
  );
}

export function WarpcastLogin() {
  const trackEvent = useTrackEvent();
  return (
    <AuthKitProvider config={warpcastConfig}>
      <Stack gap={1}>
        <WarpcastLoginButton />
        <Typography variant='caption'>seamlessly apply for retro funding with the same project</Typography>
      </Stack>
    </AuthKitProvider>
  );
}

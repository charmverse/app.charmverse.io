'use client';

import { log } from '@charmverse/core/log';
import { FarcasterLoginModal } from '@connect-shared/components/common/FarcasterModal';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { AuthKitProvider, useProfile } from '@farcaster/auth-kit';
import type { AuthClientError, StatusAPIResponse } from '@farcaster/auth-kit';
import { Box, Button, Link, Typography, lighten } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { warpcastConfig } from '@root/lib/farcaster/config';
import { prettyPrint } from '@root/lib/utils/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { loginWithFarcasterAction } from 'lib/session/loginAction';

import { WarpcastIcon } from './WarpcastIcon';

// Farcaster specific
export const farcasterBrandColor = '#8465CB';
export const farcasterBrandColorLight = lighten(farcasterBrandColor, 0.9);
export const farcasterBrandColorDark = '#6944ba';

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
      if (data?.hasJoinedWaitlist) {
        router.push('/score');
      } else {
        router.push('/join');
      }
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  const onSuccessCallback = useCallback(async (data: StatusAPIResponse) => {
    prettyPrint({ data });
    await loginUser({ loginPayload: data });
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
          bgcolor: farcasterBrandColor,
          color: theme.palette.text.primary,
          '&:hover': { background: farcasterBrandColorDark, color: theme.palette.text.primary }
        })}
        startIcon={<WarpcastIcon />}
        {...props}
      >
        {children || 'Sign in with Warpcast'}
      </Button>
      <FarcasterLoginModal open={popupState.isOpen} onClose={popupState.close} url={url} />
      {hasErrored && <Typography variant='body2'>There was an error while logging in</Typography>}
    </Box>
  );
}

export function WarpcastLogin() {
  const trackEvent = useTrackEvent();
  return (
    <AuthKitProvider config={warpcastConfig}>
      <WarpcastLoginButton />
      <Link
        variant='body2'
        href='https://www.farcaster.xyz/'
        target='_blank'
        rel='noopener'
        color='text.primary'
        fontWeight={500}
        display='block'
        onMouseDown={() => {
          trackEvent('click_dont_have_farcaster_account');
        }}
      >
        Don't have a Farcaster account?
      </Link>
      ;
    </AuthKitProvider>
  );
}

'use client';

import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { Link, Typography } from '@mui/material';

import { authConfig } from 'lib/farcaster/config';

import { WarpcastLoginButton } from './WarpcastLoginButton';

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
        <Typography fontWeight={600} color='primary'>
          Join Farcaster
        </Typography>
      </Link>
    </AuthKitProvider>
  );
}

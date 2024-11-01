'use client';

import { log } from '@charmverse/core/log';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { SinglePageLayout } from 'components/common/Layout';
import { WalletLogin } from 'components/common/WalletLogin/WalletLogin';
import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import { useGetUserTrigger } from 'hooks/api/session';

import { LaunchDate } from './LaunchDate';

export function LoginPage() {
  const { trigger: triggerReload } = useGetUserTrigger();
  const router = useRouter();
  // HACK: Remove this after we change session cookies to LAX
  useEffect(() => {
    async function loadUser() {
      const updated = await triggerReload();
      if (updated) {
        log.info('Redirect user to profile from login page', { userId: updated.id });
        router.push('/profile?tab=win');
      }
    }
    loadUser();
  }, []);

  return (
    <>
      <InfoBackgroundImage />
      <SinglePageLayout position='relative' zIndex={2} data-test='login-page'>
        <Image
          src='/images/scout-game-logo-square.png'
          width={300}
          height={150}
          sizes='100vw'
          style={{
            width: '100%',
            maxWidth: '300px',
            height: 'auto'
          }}
          alt='ScoutGame'
        />
        <Typography
          variant='h5'
          sx={{
            mb: 4,
            fontWeight: 700,
            backgroundColor: 'black',
            px: 1
          }}
        >
          Fantasy sports for onchain builders
        </Typography>
        <LaunchDate />
        <Box display='flex' flexDirection='column' gap={2} width='100%'>
          <WalletLogin />
          <WarpcastLogin />
        </Box>
      </SinglePageLayout>
    </>
  );
}

'use client';

import { Box, Link, Stack, Typography } from '@mui/material';
import { useTrackEvent } from '@packages/connect-shared/hooks/useTrackEvent';
import Image from 'next/image';

export function Footer() {
  const trackEvent = useTrackEvent();
  return (
    <Stack alignItems='center'>
      <Link
        href='https://t.me/+qlNZO93FnqEzMDkx'
        target='_blank'
        rel='noopener'
        onMouseDown={() => {
          trackEvent('click_need_help');
        }}
      >
        <Typography align='center' color='secondary' variant='caption'>
          Need help?
        </Typography>
      </Link>
      <Box
        width='100%'
        component='footer'
        textAlign='center'
        mx='auto'
        p={1}
        display='flex'
        alignItems='center'
        justifyContent='center'
        gap={0.5}
      >
        <Typography component='span'>Powered by</Typography>
        <Link
          href='https://charmverse.io'
          target='_blank'
          rel='noopener'
          onMouseDown={() => {
            trackEvent('click_powered_by_charmverse');
          }}
        >
          <Image
            src='/images/charmverse-logo-white.webp'
            width={100}
            height={20}
            alt='CharmVerse'
            style={{ verticalAlign: 'middle' }}
          />
        </Link>
      </Box>
    </Stack>
  );
}

import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

import { LaunchDate } from './LaunchDate';

export function LoginPage() {
  return (
    <>
      <InfoBackgroundImage />
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        maxWidth='100vw'
        border='none'
        borderRadius='0'
        textAlign='center'
        bgcolor='transparent'
        data-test='login-page'
        position='relative'
        zIndex='2'
        justifyContent='space-evenly'
        gap={4}
        minHeight='calc(100svh - 48px)'
      >
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
        <Typography variant='h5' fontWeight='700'>
          Fantasy sports for onchain builders
        </Typography>
        <LaunchDate />
        <Box display='flex' flexDirection='column' gap={2} width='100%'>
          <WarpcastLogin />
        </Box>
      </Box>
    </>
  );
}

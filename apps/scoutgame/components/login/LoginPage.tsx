import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { Hidden } from 'components/common/Hidden';
import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';
import { InfoWrapper } from 'components/layout/InfoWrapper';

import { LaunchDate } from './LaunchDate';

export function LoginPage() {
  return (
    <InfoWrapper>
      <Hidden mdDown>
        <Image
          src='/images/desktop_login_background.png'
          width={800}
          height={600}
          sizes='100vw'
          alt='ScoutGame'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />
      </Hidden>
      <Hidden mdUp>
        <Image
          src='/images/mobile_login_background.png'
          width={300}
          height={300}
          sizes='100vw'
          alt='ScoutGame'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />
      </Hidden>
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
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2,
          gap: 4,
          alignItems: 'center',
          minHeight: 'calc(100svh - 100px)'
        }}
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
    </InfoWrapper>
  );
}

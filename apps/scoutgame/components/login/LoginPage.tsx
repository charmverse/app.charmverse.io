import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { SinglePageLayout } from 'components/common/Layout';
import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

import { LaunchDate } from './LaunchDate';

export function LoginPage() {
  return (
    <>
      <InfoBackgroundImage />
      <SinglePageLayout position='relative' zIndex={2}>
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
      </SinglePageLayout>
    </>
  );
}

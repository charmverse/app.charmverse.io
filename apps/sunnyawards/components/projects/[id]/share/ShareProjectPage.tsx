import { Stack, Typography } from '@mui/material';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import Image from 'next/image';

import { TwitterShareButton } from './components/TwitterShareButton';
import { WarpcastShareButton } from './components/WarpcastShareButton';

const celebrationImage = '/images/sunny-celebration.png';

export async function ShareProjectPage({ path }: { path: string }) {
  return (
    <PageWrapper
      display='flex'
      flexDirection='column'
      alignItems='center'
      maxWidth='100vw'
      border='none'
      borderRadius='0'
      textAlign='center'
      bgcolor='transparent'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1, md: 4 },
        my: { xs: 0, md: 4 },
        justifyContent: { xs: 'space-evenly', md: 'normal' },
        alignItems: 'center',
        height: '100%'
      }}
    >
      <Image
        src={celebrationImage}
        width={1920}
        height={1077}
        style={{
          width: '600px',
          maxWidth: '100%',
          height: 'auto'
        }}
        alt='Charmverse Connect homepage'
      />
      <Typography align='center' variant='h4'>
        Congratulations! Your project has just entered the SUNNYs
      </Typography>
      <Typography align='center'>Share the good news for VIP Seats!</Typography>
      <Stack flexDirection={{ md: 'row' }} gap={4}>
        <WarpcastShareButton projectIdOrPath={path} />
        <TwitterShareButton projectPath={path} />
      </Stack>
    </PageWrapper>
  );
}

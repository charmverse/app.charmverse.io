import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { TwitterShareButton } from 'components/projects/[id]/share/components/TwitterShareButton';
import { WarpcastShareButton } from 'components/projects/[id]/share/components/WarpcastShareButton';

export default async function PublishProjectPage({ params }: { params: { path: string } }) {
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
        src='/images/sunny-awards-banner.webp'
        width={500}
        height={200}
        sizes='100vw'
        style={{
          width: '100%',
          maxWidth: '400px',
          height: 'auto'
        }}
        alt='Charmverse Connect homepage'
      />
      <Typography align='center' variant='h4'>
        Congratulations your project has just entered the Sunny Awards
      </Typography>
      <Typography align='center'>Share the good news!</Typography>
      <Stack flexDirection={{ md: 'row' }} gap={4}>
        <WarpcastShareButton projectIdOrPath={params.path} />
        <TwitterShareButton projectPath={params.path} image='https://s0.2mdn.net/simgad/1430085343475946313' />
      </Stack>
    </PageWrapper>
  );
}

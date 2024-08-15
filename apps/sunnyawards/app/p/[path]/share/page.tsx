import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { ShareProjectToWarpcastButton } from 'components/projects/[id]/share/components/ShareProjectToWarpcastButton';

export default function PublishProjectPage({ params }: { params: { path: string } }) {
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
      <Typography align='center'>Share the good news on Warpcast!</Typography>
      <ShareProjectToWarpcastButton projectIdOrPath={params.path} />
    </PageWrapper>
  );
}

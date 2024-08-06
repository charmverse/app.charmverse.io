import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box } from '@mui/material';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { PageTitle } from 'components/common/PageTitle';
import { PublishProjectToGitcoin } from 'components/projects/[id]/PublishProjectToGitcoin';
import { ShareButton } from 'components/projects/components/ProjectShareButton';
import { ShareProjectToWarpcastButton } from 'components/projects/components/ShareProjectToWarpcastButton';

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
      sx={{
        '& > .MuiBox-root': {
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 0, md: 6 },
          my: { xs: 0, md: 4 },
          justifyContent: { xs: 'space-evenly', md: 'normal' },
          alignItems: 'center',
          height: '100%'
        }
      }}
    >
      <Image
        src='/images/sunny-awards.png'
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
      <MuiLink
        variant='body2'
        href='https://warpcast.com/~/signup'
        target='_blank'
        rel='noopener'
        color='text.primary'
        fontWeight={500}
        display='block'
      >
        Don't have a Farcaster account?
      </MuiLink>
    </PageWrapper>
  );
}

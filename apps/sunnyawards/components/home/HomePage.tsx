import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { WarpcastLogin } from './components/WarpcastLogin';

export function HomePage() {
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
        width={400}
        height={200}
        sizes='100vw'
        style={{
          width: '100%',
          maxWidth: '400px',
          height: 'auto'
        }}
        alt='Charmverse Connect homepage'
      />
      <Typography data-test='connect-home-page' align='center' variant='h4'>
        Celebrate Onchain Summer with the Sunny Awards
      </Typography>
      <Typography align='center'>
        Create your project and submit it to the Sunny Awards to compete for 540K OP in total prizes.
      </Typography>
      <WarpcastLogin />
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

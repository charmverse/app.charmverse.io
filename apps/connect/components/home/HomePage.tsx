import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';

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
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
        height: '100%'
      }}
    >
      <Image
        src='/images/geral_waving.png'
        width={250}
        height={200}
        sizes='100vw'
        style={{
          maxWidth: '400px',
          height: 'auto'
        }}
        alt='Charmverse Connect homepage'
      />
      <Typography data-test='connect-home-page' align='center' variant='h4'>
        Charm Connect: The Home for Builders
      </Typography>
      <Typography align='center'>Endorse Builders, Connect with opportunites and get Rewarded.</Typography>
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

import { PageWrapper } from '@connect/components/common/PageWrapper';
import { WarpcastLogin } from '@connect/components/common/WarpcastLogin/WarpcastLogin';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

export function HomePage() {
  return (
    <PageWrapper
      display='flex'
      flexDirection='column'
      alignItems='center'
      gap={4}
      maxWidth='100vw'
      border='0'
      textAlign='center'
    >
      <Image
        src='/images/homepage-banner.png'
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
      <Typography align='center' variant='h4' my={2}>
        Celebrate Onchain Summer with the Sunny Awards
      </Typography>
      <Typography align='center' my={2}>
        Create your project and submit it to the Sunny Awards to compete for 540K OP in total prizes.
      </Typography>
      <WarpcastLogin />
      <MuiLink
        variant='body2'
        href='https://warpcast.com/~/signup'
        target='_blank'
        rel='noopener'
        color='inherit'
        mt={1}
        display='block'
      >
        Don't have a Farcaster account?
      </MuiLink>
    </PageWrapper>
  );
}

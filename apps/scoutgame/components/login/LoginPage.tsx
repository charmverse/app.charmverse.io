import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box } from '@mui/material';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { SinglePageLayout } from 'components/common/Layout';
import { WalletLogin } from 'components/common/WalletLogin/WalletLogin';
import { WalletProvider } from 'components/common/WalletLogin/WalletProvider';
import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';

export function LoginPage({ successPath }: { successPath: string }) {
  return (
    <SinglePageLayout>
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
      <Typography align='center'>Endorse Builders, Connect with opportunities and get Rewarded.</Typography>
      <WalletProvider>
        <WalletLogin successPath={successPath} />
      </WalletProvider>
      <WarpcastLogin successPath={successPath} />
      <MuiLink
        variant='body2'
        href='https://www.farcaster.xyz/'
        target='_blank'
        rel='noopener'
        color='text.primary'
        fontWeight={500}
        display='block'
      >
        Don't have a Farcaster account?
      </MuiLink>
    </SinglePageLayout>
  );
}

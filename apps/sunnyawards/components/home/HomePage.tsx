import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import Image from 'next/image';

import { WalletLogin } from 'components/common/WalletLogin/WalletLogin';

import { WarpcastLogin } from '../common/WarpcastLogin/WarpcastLogin';

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
      bgcolor='transparent'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        my: { xs: 0, md: 4 },
        justifyContent: { xs: 'space-evenly', md: 'normal' },
        alignItems: 'center',
        height: '100%'
      }}
    >
      <Image
        src='/images/sunny-awards-banner.webp'
        width={400}
        height={200}
        sizes='100vw'
        style={{
          width: '100%',
          maxWidth: '400px',
          height: 'auto',
          filter: 'drop-shadow(6px 6px 6px rgba(251, 251, 201, 0.7))'
        }}
        alt='SUNNY Awards homepage'
      />
      <Typography data-test='connect-home-page' align='center' variant='h4'>
        Celebrate Onchain Summer with the SUNNY Awards
      </Typography>
      <Typography align='center' data-test='homepage-description'>
        Build your project and submit it to the{' '}
        <MuiLink href='https://www.thesunnyawards.fun/' target='_blank'>
          The SUNNYs
        </MuiLink>{' '}
        to claim your ticket.
      </Typography>
      <WarpcastLogin />
      <WalletLogin successPath='/profile' />
    </PageWrapper>
  );
}

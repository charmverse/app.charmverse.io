import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/system';
import Image from 'next/image';

import { SinglePageLayout } from 'components/common/Layout';
import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';

export function LoginPage({ successPath }: { successPath: string }) {
  return (
    <SinglePageLayout>
      <Image
        src='/images/scout-game-logo-square.png'
        width={400}
        height={200}
        sizes='100vw'
        style={{
          width: '100%',
          maxWidth: '400px',
          height: 'auto'
        }}
        alt='ScoutGame'
      />
      <Typography variant='h5' mb={2} fontWeight='700'>
        Scout. Build. Win.
      </Typography>
      <Stack gap={2} width='100%' px={3}>
        <WarpcastLogin successPath={successPath} />
        <MuiLink
          variant='body2'
          href='https://www.farcaster.xyz/'
          target='_blank'
          rel='noopener'
          color='primary'
          fontWeight={500}
          display='block'
        >
          Join Farcaster
        </MuiLink>
      </Stack>
    </SinglePageLayout>
  );
}

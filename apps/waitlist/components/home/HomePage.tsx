import 'server-only';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import JoinWaitlistButton from 'components/common/JoinWaitlistButton';
import { LearnMore } from 'components/common/LearnMore';
import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';
import type { SessionData } from 'lib/session/config';

export function HomePage({ farcasterUser }: { farcasterUser?: SessionData['farcasterUser'] }) {
  return (
    <PageWrapper py={0} my={0}>
      <Box
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
          my: 0,
          justifyContent: 'space-evenly',
          alignItems: 'center',
          minHeight: 'calc(100svh - 100px)'
        }}
      >
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
        <Box>
          <Typography variant='h5' mb={2} fontWeight='700'>
            Scout. Build. Win.
          </Typography>
          <Typography variant='subtitle1' mb={2} fontWeight='500'>
            Join the waitlist, receive free Scout credits, and be the first in line to play!
          </Typography>
        </Box>
        <Box display='flex' flexDirection='column' gap={3} width='100%'>
          {farcasterUser ? <JoinWaitlistButton /> : <WarpcastLogin />}
        </Box>
      </Box>
      <Box>
        <LearnMore />
      </Box>
    </PageWrapper>
  );
}

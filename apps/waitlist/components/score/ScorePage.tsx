import 'server-only';

import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box, Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { FadeIn } from 'components/common/Animations/FadeIn';
import { LearnMore } from 'components/common/LearnMore';
import { shareFrameUrl } from 'lib/frame/actionButtons';

import ProgressBar from './ScoresProgressBar';
import { ScoreTier } from './ScoreTier';

export function ScorePage({
  waitlistSlot,
  fid
}: {
  waitlistSlot: ConnectWaitlistSlot & { clicks: number };
  fid: string;
}) {
  const hasRegisteredAsBuilder = !!waitlistSlot?.githubLogin;

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
        <FadeIn height={200}>
          <Image
            src='/images/scout-game-logo.png'
            width={400}
            height={200}
            sizes='100vw'
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto'
            }}
            alt='Scout game score'
          />
        </FadeIn>
        <Typography variant='h5' mb={2} fontWeight='700'>
          Let's race to the top!
        </Typography>
        <Stack
          component={FadeIn}
          width='100%'
          borderColor='secondary.main'
          borderRadius='5px'
          sx={{ borderWidth: '1px', borderStyle: 'solid' }}
          flexDirection='column'
          p={4}
        >
          <ScoreTier waitlistSlot={waitlistSlot} />
          <ProgressBar from={0} to={waitlistSlot.percentile ?? 0} />
        </Stack>
        <Typography variant='h5' my={2} fontWeight='700' color='secondary'>
          Move up the Waitlist!
        </Typography>
        <Box width='100%'>
          <Button target='_blank' rel='noopener noreferrer' href={shareFrameUrl(fid)} sx={{ width: '100%', mb: 2 }}>
            Share your Frame
          </Button>
          {!hasRegisteredAsBuilder && (
            <Typography variant='body2' color='secondary.light' textAlign='left'>
              Earn 10 Frame Clicks
            </Typography>
          )}
          <Button component={Link} href='/builders' disabled={hasRegisteredAsBuilder} sx={{ width: '100%' }}>
            {hasRegisteredAsBuilder ? 'Builder registered!' : 'Sign up as a Builder'}
          </Button>
        </Box>
      </Box>
      <Box>
        <LearnMore />
      </Box>
    </PageWrapper>
  );
}

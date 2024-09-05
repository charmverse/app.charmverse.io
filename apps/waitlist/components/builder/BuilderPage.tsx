import 'server-only';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { LearnMore } from 'components/common/LearnMore';
import { JoinGithubButton } from 'components/github/JoinGithubButton';

export function BuilderPage() {
  return (
    <PageWrapper py={0} my={0}>
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        maxWidth='100vw'
        border='none'
        borderRadius='0'
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
        <Typography variant='h5' mb={2} fontWeight='700' color='text.secondary'>
          Sign up as a Builder!
        </Typography>
        <Typography mb={2}>
          Scout Game rewards Builders for contributing to the onchain ecosystem. You earn more rewards when scouts show
          their support by minting your unique NFT.
        </Typography>
        <Typography mb={2}>
          Sign up as a Builder now, and you will be eligible to earn Charm Points and a share of your NFT sales during
          the first season of Scout Game.
        </Typography>
        <Typography mb={2}>You will also earn 10 Frame Clicks to help you move up the Waitlist!</Typography>
        <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
        <Typography mb={2}>Connect to GitHub to sign up and verify your code contributions.</Typography>
        <Box width='100%'>
          <Suspense>
            <JoinGithubButton />
          </Suspense>
          <Button component={Link} variant='text' href='/score' sx={{ width: '100%', mt: 1 }}>
            Cancel
          </Button>
        </Box>
      </Box>
      <Box>
        <LearnMore />
      </Box>
    </PageWrapper>
  );
}

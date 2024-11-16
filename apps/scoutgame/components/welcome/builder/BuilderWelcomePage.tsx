import 'server-only';

import { Box, Typography } from '@mui/material';
import { JoinGithubButton } from '@packages/scoutgame-ui/components/common/JoinGithubButton';
import Image from 'next/image';
import { Suspense } from 'react';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

import { SkipBuilderStepButton } from './components/SkipBuilderStepButton';

export function BuilderPage() {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <Box display='flex' flexDirection='column' alignItems='center' my={0} justifyContent='space-evenly' gap={2}>
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
          <Typography variant='h5' fontWeight='700' color='text.secondary'>
            Are you a builder?
          </Typography>
          <Typography>
            Scout Game rewards Builders for contributing to the onchain ecosystem. You earn more rewards when scouts
            show their support by minting your unique NFT.
          </Typography>
          <Typography>
            Sign up as a Builder now, and you will be eligible to earn Scout Points and a share of your NFT sales during
            the first season of Scout Game.
          </Typography>
          <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
          <Typography>Connect to GitHub to sign up and verify your code contributions.</Typography>
          <Box width='100%'>
            <Suspense>
              <Box display='flex' flexDirection='column' gap={2}>
                <JoinGithubButton />
                <SkipBuilderStepButton />
              </Box>
            </Suspense>
          </Box>
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

import type { Scout } from '@charmverse/core/prisma';
import { Button, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';
import Link from 'next/link';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { JoinGithubButton } from 'components/github/JoinGithubButton';

export function BuilderWelcomePage({ user }: { user: Scout }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Stack alignItems='center' justifyContent='center'>
          <Image src='/images/scout-game-logo.png' alt='Builder welcome' width={300} height={133.33} />
        </Stack>
        <Box display='flex' gap={2} flexDirection='column'>
          <Typography variant='h5' textAlign='center' color='secondary' fontWeight='bold'>
            Are you a builder?
          </Typography>
          <Typography>
            Scout Game rewards Builders for contributing to the onchain ecosystem. You earn more rewards when scouts
            show their support by minting your unique NFT.
          </Typography>
          <Typography>
            Sign up as a Builder now, and you will be eligible to earn Charm Points and a share of your NFT sales during
            the current season of Scout Game.
          </Typography>
          <Stack direction='row' justifyContent='center'>
            <Image src='/images/github-logo.png' width={120} height={30} alt='github' />
          </Stack>
          <Typography mb={2}>Connect to GitHub to sign up and verify your code contributions.</Typography>
          <JoinGithubButton />
          <Stack direction='row' justifyContent='center'>
            <Link href='/'>
              <Typography color='primary'>Skip for now</Typography>
            </Link>
          </Stack>
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

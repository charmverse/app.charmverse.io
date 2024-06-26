import { PageWrapper } from '@connect/components/common/PageWrapper';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LoggedInUser } from 'models/User';

import { FarcasterCard } from '../common/FarcasterCard';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as
    | Required<Pick<FarcasterBody, 'bio' | 'username' | 'displayName' | 'pfpUrl'>>
    | undefined;

  return (
    <PageWrapper display='flex' gap={2} flexDirection='column'>
      <Box textAlign='center'>
        <Typography variant='h3' component='h1' my={2}>
          Welcome
        </Typography>
        <Typography>
          This is your profile. You can use it to create projects which can be used with Optimism's grant programs.
        </Typography>
      </Box>
      {farcasterDetails && (
        <FarcasterCard
          avatar={farcasterDetails.pfpUrl}
          bio={farcasterDetails.bio}
          username={farcasterDetails.username}
        />
      )}
      <Box mt={2} display='flex' gap={2} flexDirection='column'>
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

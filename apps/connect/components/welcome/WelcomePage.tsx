import { PageTitle } from '@connect/components/common/PageTitle';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { LoggedInUser } from 'models/User';

import { FarcasterCard } from '../common/FarcasterCard';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as
    | Required<Pick<FarcasterBody, 'bio' | 'username' | 'displayName' | 'pfpUrl' | 'fid'>>
    | undefined;

  return (
    <PageWrapper>
      <Box display='flex' gap={2} flexDirection='column'>
        <PageTitle>Welcome</PageTitle>
        <Typography align='center' my={2}>
          This is your profile. You can use it to create projects which can be used with Optimism's grant programs.
        </Typography>
        {farcasterDetails && (
          <FarcasterCard
            name={farcasterDetails.displayName}
            avatar={farcasterDetails.pfpUrl}
            bio={farcasterDetails.bio}
            username={farcasterDetails.username}
            fid={farcasterDetails.fid}
          />
        )}
        <br />
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

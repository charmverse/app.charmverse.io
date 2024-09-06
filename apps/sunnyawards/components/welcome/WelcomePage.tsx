import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { FarcasterCard } from '../common/FarcasterCard';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <PageWrapper bgcolor='transparent'>
      <Box display='flex' gap={2} flexDirection='column'>
        <Typography align='center' my={2}>
          This is your profile. You can use it to create projects which can be used with Optimism's grant programs.
        </Typography>
        {farcasterDetails && (
          <FarcasterCard
            name={farcasterDetails.displayName}
            avatar={farcasterDetails.pfpUrl}
            bio={farcasterDetails.bio}
            username={farcasterDetails.username}
          />
        )}
        <br />
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

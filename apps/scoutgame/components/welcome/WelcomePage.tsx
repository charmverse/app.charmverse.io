import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <PageWrapper>
      <Box display='flex' gap={2} flexDirection='column'>
        {farcasterDetails && (
          <FarcasterCard
            name={farcasterDetails.displayName}
            avatar={farcasterDetails.pfpUrl}
            bio={farcasterDetails.bio}
            username={farcasterDetails.username}
            fid={user.farcasterUser?.fid}
          />
        )}
        <br />
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

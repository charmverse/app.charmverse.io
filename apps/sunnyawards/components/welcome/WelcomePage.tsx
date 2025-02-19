import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';

import { FarcasterCard, getFarcasterCardDisplayDetails } from 'components/common/FarcasterCard';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: LoggedInUser }) {
  const profile = getFarcasterCardDisplayDetails(user);

  return (
    <PageWrapper bgcolor='transparent'>
      <Box display='flex' gap={2} flexDirection='column'>
        <Typography align='center' my={2}>
          This is your profile. You can use it to create projects which can be used with Optimism's grant programs.
        </Typography>
        <FarcasterCard {...profile} />

        <br />
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

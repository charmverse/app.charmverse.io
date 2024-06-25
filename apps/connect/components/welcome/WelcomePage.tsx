import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { Avatar } from 'components/common/Avatar';
import { PageWrapper } from 'components/common/PageWrapper';
import type { LoggedInUser } from 'lib/profile/types';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Pick<FarcasterBody, 'bio' | 'username' | 'pfpUrl'>;

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
      <Card>
        <CardContent sx={{ display: 'flex', gap: 2 }}>
          <Avatar size='xLarge' name={farcasterDetails.username} avatar={farcasterDetails.pfpUrl} />
          <Box>
            <Typography>{farcasterDetails.username}</Typography>
            <Typography>{farcasterDetails.bio}</Typography>
          </Box>
        </CardContent>
      </Card>
      <Box mt={2} display='flex' gap={2} flexDirection='column'>
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

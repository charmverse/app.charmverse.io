import type { Scout } from '@charmverse/core/prisma';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import Box from '@mui/material/Box';

import { FarcasterCard } from 'components/common/FarcasterCard';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: Scout }) {
  return (
    <PageWrapper>
      <Box display='flex' gap={2} flexDirection='column'>
        {user.farcasterId && <FarcasterCard name={user.username} avatar={user.avatar} username={user.username} />}
        <br />
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}

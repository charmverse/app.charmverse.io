import type { Scout } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';

import { FarcasterCard } from 'components/common/FarcasterCard';
import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

import { ExtraDetailsForm } from './components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: Scout }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Box display='flex' gap={2} flexDirection='column'>
          {user.farcasterId && <FarcasterCard name={user.username} avatar={user.avatar} username={user.username} />}
          <br />
          <ExtraDetailsForm />
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

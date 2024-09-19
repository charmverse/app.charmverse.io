import type { Scout } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { UserProfile } from 'components/common/UserProfile';

import { ExtraDetailsForm } from './components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: Scout }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Box display='flex' gap={3} flexDirection='column' alignItems='flex-start'>
          {user.farcasterId && <UserProfile user={user} />}
          <ExtraDetailsForm />
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

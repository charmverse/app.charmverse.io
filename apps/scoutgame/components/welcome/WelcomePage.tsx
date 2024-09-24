import type { Scout } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';

import { SinglePageLayout } from 'components/common/Layout';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

import { ExtraDetailsForm } from './components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: Scout }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Box display='flex' gap={3} flexDirection='column' alignItems='flex-start'>
          {user.farcasterId && (
            <UserProfile
              user={{
                ...user,
                avatar: user.avatar ?? ''
              }}
            />
          )}
          <ExtraDetailsForm />
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

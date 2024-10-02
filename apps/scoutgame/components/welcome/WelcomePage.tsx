import Box from '@mui/material/Box';

import { SinglePageLayout } from 'components/common/Layout';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import type { SessionUser } from 'lib/session/getUserFromSession';

import { ExtraDetailsForm } from './builder/components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: SessionUser }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Box display='flex' gap={3} flexDirection='column' alignItems='flex-start' data-test='welcome-page'>
          <UserProfile
            user={{
              ...user,
              avatar: user.avatar
            }}
          />
          <ExtraDetailsForm user={user} />
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

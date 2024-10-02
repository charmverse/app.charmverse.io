import Box from '@mui/material/Box';

import { SinglePageLayout } from 'components/common/Layout';
import type { UserProfileData } from 'components/common/Profile/UserProfile';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

import { ExtraDetailsForm } from './builder/components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: UserProfileData }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Box display='flex' gap={3} flexDirection='column' alignItems='flex-start' data-test='welcome-page'>
          <UserProfile
            user={{
              ...user
            }}
          />
          <ExtraDetailsForm />
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

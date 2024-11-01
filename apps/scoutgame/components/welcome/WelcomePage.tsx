import { Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';

import { SinglePageLayout } from 'components/common/Layout';
import { EditableUserProfile } from 'components/common/Profile/EditableUserProfile';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import type { SessionUser } from 'lib/session/getUserFromSession';

import { ExtraDetailsForm } from './builder/components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: SessionUser }) {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <ExtraDetailsForm user={user} />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}

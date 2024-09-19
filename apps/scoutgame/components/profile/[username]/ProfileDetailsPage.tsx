import 'server-only';

import type { Scout } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import { Suspense } from 'react';

import { ProfileMenu } from 'components/common/Tabs/ProfileMenu';
import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

import { ProfileTabs } from './Tabs/ProfileTabs';

export async function ProfileDetailsPage({ user, tab }: { user: Scout; tab: string }) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      <ProfileMenu tab={tab} username={user.username} />
      <Suspense fallback={<LoadingComponent />} key={tab}>
        <ProfileTabs tab={tab} user={user} />
      </Suspense>
    </Box>
  );
}

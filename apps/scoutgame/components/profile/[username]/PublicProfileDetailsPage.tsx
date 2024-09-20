import 'server-only';

import type { Scout } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import { Suspense } from 'react';

import { PublicProfileMenu } from 'components/common/Tabs/PublicProfileMenu';
import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

import { PublicProfileTabs } from './Tabs/PublicProfileTabs';

export async function PublicProfileDetailsPage({ user, tab }: { user: Scout; tab: string }) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      <PublicProfileMenu tab={tab} username={user.username} />
      <PublicProfileTabs tab={tab} user={user} />
    </Box>
  );
}

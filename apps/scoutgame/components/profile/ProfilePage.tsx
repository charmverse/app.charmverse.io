import type { Scout } from '@charmverse/core/prisma-client';
import { Typography, Box } from '@mui/material';
import { Suspense } from 'react';

import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { UserProfile } from 'components/common/UserProfile';
import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

export async function ProfilePage({ user }: { user: Scout }) {
  return (
    <SinglePageWrapper>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <UserProfile user={user} />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<LoadingComponent />}></Suspense>
      </Box>
    </SinglePageWrapper>
  );
}

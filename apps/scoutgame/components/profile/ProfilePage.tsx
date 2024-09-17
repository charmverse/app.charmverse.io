import type { Scout } from '@charmverse/core/prisma-client';
import { Typography, Box } from '@mui/material';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

export async function ProfilePage({ user }: { user: Scout }) {
  return (
    <SinglePageWrapper>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <FarcasterCard name={user.username} username={user.username} avatar={user.avatar} enableLink />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<LoadingComponent />}></Suspense>
      </Box>
    </SinglePageWrapper>
  );
}

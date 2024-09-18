import type { Scout } from '@charmverse/core/prisma';
import { Typography, Box } from '@mui/material';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

export async function ProfileDetailsPage({ user }: { user: Scout }) {
  return (
    <SinglePageWrapper>
      <Box gap={2} display='flex' flexDirection='column'>
        <FarcasterCard name={user.displayName} username={user.username} avatar={user.avatar} />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<LoadingComponent />}></Suspense>
      </Box>
    </SinglePageWrapper>
  );
}

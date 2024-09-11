import type { Scout } from '@charmverse/core/prisma';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';

export async function ProfileDetailsPage({ user }: { user: Scout }) {
  return (
    <PageWrapper>
      <Box gap={2} display='flex' flexDirection='column'>
        <FarcasterCard name={user.displayName} username={user.username} avatar={user.avatar} />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<LoadingComponent />}></Suspense>
      </Box>
    </PageWrapper>
  );
}

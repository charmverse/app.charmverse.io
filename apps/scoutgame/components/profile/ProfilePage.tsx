import type { Scout } from '@charmverse/core/prisma-client';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';

export async function ProfilePage({ user }: { user: Scout }) {
  return (
    <PageWrapper>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <FarcasterCard name={user.username} username={user.username} avatar={user.avatar} enableLink />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<LoadingComponent />}></Suspense>
      </Box>
    </PageWrapper>
  );
}

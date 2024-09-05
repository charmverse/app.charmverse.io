import type { Scout } from '@charmverse/core/prisma-client';
import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

export async function ProfilePage({ user }: { user: Scout }) {
  return (
    <PageWrapper>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <FarcasterCard
          fid={user.farcasterId ? Number(user.farcasterId) : undefined}
          name={user.username ?? undefined}
          username={user.username ?? undefined}
          avatar={user.avatar ?? undefined}
          enableLink
        />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<LoadingComponent />}></Suspense>
      </Box>
    </PageWrapper>
  );
}

import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';
import { Suspense } from 'react';

import { FarcasterCard, getFarcasterCardDisplayDetails } from 'components/common/FarcasterCard';

import { NewProjectItem } from './components/NewProjectItem';
import { ProjectItemSkeleton } from './components/ProjectItemSkeleton';
import { ProjectsList } from './components/ProjectsList';

export async function ProfilePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  const profile = getFarcasterCardDisplayDetails(user);

  return (
    <PageWrapper bgcolor='transparent'>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <FarcasterCard fid={user.farcasterUser?.fid} {...profile} />
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList userId={user.id} />
        </Suspense>
        <NewProjectItem href='/projects/new'>Create a submission</NewProjectItem>
      </Box>
    </PageWrapper>
  );
}

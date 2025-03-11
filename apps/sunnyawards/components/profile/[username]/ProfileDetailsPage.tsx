import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@packages/connect-shared/lib/profile/getCurrentUserAction';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';

import { ProjectItemSkeleton } from '../components/ProjectItemSkeleton';
import { ProjectsList } from '../components/ProjectsList';

export async function ProfileDetailsPage({ user }: { user: Pick<LoggedInUser, 'farcasterUser' | 'id'> }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <PageWrapper bgcolor='transparent'>
      <Box gap={2} display='flex' flexDirection='column'>
        <FarcasterCard
          fid={user.farcasterUser?.fid}
          name={farcasterDetails?.displayName || farcasterDetails?.username}
          username={farcasterDetails?.username}
          avatar={farcasterDetails?.pfpUrl}
          bio={farcasterDetails?.bio}
        />
        <Typography variant='h6'>SUNNYs Submissions</Typography>
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList userId={user.id} />
        </Suspense>
      </Box>
    </PageWrapper>
  );
}

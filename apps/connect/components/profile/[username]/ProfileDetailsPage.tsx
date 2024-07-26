import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';
import { PageWrapper } from 'components/common/PageWrapper';
import { ProjectItemSkeleton } from 'components/projects/components/ProjectItemSkeleton';
import { ProjectsList } from 'components/projects/components/ProjectsList';

export async function ProfileDetailsPage({ user }: { user: Pick<LoggedInUser, 'farcasterUser' | 'id'> }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <PageWrapper>
      <Box gap={2} display='flex' flexDirection='column'>
        <FarcasterCard
          fid={user.farcasterUser?.fid}
          name={farcasterDetails?.displayName}
          username={farcasterDetails?.username}
          avatar={farcasterDetails?.pfpUrl}
          bio={farcasterDetails?.bio}
        />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList userId={user.id} />
        </Suspense>
      </Box>
    </PageWrapper>
  );
}

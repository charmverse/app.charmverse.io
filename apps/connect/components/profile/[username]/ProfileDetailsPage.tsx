import { FarcasterCard } from '@connect/components/common/FarcasterCard';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { ProjectItemSkeleton } from '@connect/components/projects/components/ProjectItemSkeleton';
import { ProjectsList } from '@connect/components/projects/components/ProjectsList';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

import type { LoggedInUser } from 'models/User';

export async function ProfileDetailsPage({ user }: { user: Pick<LoggedInUser, 'farcasterUser' | 'id'> | null }) {
  if (!user?.farcasterUser) {
    return (
      <PageWrapper backToProfileHeader>
        <Box p={2} mt={5}>
          <Typography variant='h6'>User not found</Typography>
        </Box>
      </PageWrapper>
    );
  }

  const farcasterDetails = user?.farcasterUser?.account as Required<
    Pick<FarcasterBody, 'bio' | 'username' | 'displayName' | 'pfpUrl'>
  >;

  return (
    <PageWrapper backToProfileHeader>
      <Box p={2} mt={5}>
        <Box gap={2} display='flex' flexDirection='column'>
          <FarcasterCard
            fid={user.farcasterUser?.fid}
            name={farcasterDetails?.displayName}
            username={farcasterDetails?.username}
            avatar={farcasterDetails?.pfpUrl}
            bio={farcasterDetails?.bio}
            disableLink
          />
          <Typography variant='h6'>Projects</Typography>
          <Suspense fallback={<ProjectItemSkeleton />}>
            <ProjectsList userId={user.id} />
          </Suspense>
        </Box>
      </Box>
    </PageWrapper>
  );
}

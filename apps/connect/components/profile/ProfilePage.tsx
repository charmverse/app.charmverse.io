import { FarcasterCard } from '@connect/components/common/FarcasterCard';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { ProjectsList } from '@connect/components/projects/components/ProjectsList';
import type { LoggedInUser } from '@connect/lib/profile/interfaces';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

import { ProjectItemSkeleton } from '../projects/components/ProjectItemSkeleton';

import { NewProjectItem } from './components/NewProjectItem';

export async function ProfilePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <PageWrapper>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <FarcasterCard
          fid={user.farcasterUser?.fid}
          name={farcasterDetails?.displayName}
          username={farcasterDetails?.username}
          avatar={farcasterDetails?.pfpUrl}
          bio={farcasterDetails?.bio}
          enableLink
        />
        <Typography variant='h6'>Projects</Typography>
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList userId={user.id} />
        </Suspense>
        <NewProjectItem href='/projects/new'>Create a project</NewProjectItem>
      </Box>
    </PageWrapper>
  );
}

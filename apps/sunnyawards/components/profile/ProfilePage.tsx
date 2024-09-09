import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Suspense } from 'react';

import { FarcasterCard } from 'components/common/FarcasterCard';

import { NewProjectItem } from './components/NewProjectItem';
import { ProjectItemSkeleton } from './components/ProjectItemSkeleton';
import { ProjectsList } from './components/ProjectsList';

export async function ProfilePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Required<FarcasterBody> | undefined;

  return (
    <PageWrapper bgcolor='transparent'>
      <Box gap={3} display='flex' flexDirection='column' mt={{ md: 2 }}>
        <FarcasterCard
          fid={user.farcasterUser?.fid}
          name={farcasterDetails?.displayName || farcasterDetails?.username}
          username={farcasterDetails?.username}
          avatar={farcasterDetails?.pfpUrl}
          bio={farcasterDetails?.bio}
        />
        <Typography variant='h6'>My SUNNYs Submissions</Typography>
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList userId={user.id} />
        </Suspense>

        <Typography sx={{ mt: 4 }} textAlign='center' variant='h6'>
          Submissions ended September 9th
        </Typography>
        {/* <NewProjectItem href='/projects/new'>Create a submission</NewProjectItem> */}
      </Box>
    </PageWrapper>
  );
}

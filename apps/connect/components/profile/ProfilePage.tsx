import { FarcasterCard } from '@connect/components/common/FarcasterCard';
import { PageTitle } from '@connect/components/common/PageTitle';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { ProjectsList } from '@connect/components/projects/components/ProjectsList';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';

import type { LoggedInUser } from 'models/User';

import { NewProjectItem } from './components/NewProjectItem';

export async function ProfilePage({ user }: { user: LoggedInUser }) {
  const farcasterDetails = user.farcasterUser?.account as Required<
    Pick<FarcasterBody, 'bio' | 'username' | 'displayName' | 'pfpUrl' | 'fid'>
  >;

  return (
    <PageWrapper>
      <Box gap={2} display='flex' flexDirection='column'>
        <PageTitle>My Profile</PageTitle>
        <FarcasterCard
          fid={farcasterDetails.fid}
          name={farcasterDetails.displayName}
          username={farcasterDetails.username}
          avatar={farcasterDetails.pfpUrl}
          bio={farcasterDetails.bio}
        />
        <Typography variant='h6'>Projects</Typography>
        <ProjectsList userProjects />
        <NewProjectItem href='/projects/new'>Create a project</NewProjectItem>
      </Box>
    </PageWrapper>
  );
}

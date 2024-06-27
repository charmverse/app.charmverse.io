import { FarcasterCard } from '@connect/components/common/FarcasterCard';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { ProjectsList } from '@connect/components/projects/ProjectsList';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Profile() {
  const user = await getCurrentUser();

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.connectOnboarded) {
    redirect('/welcome');
  }

  const farcasterDetails = user.data.farcasterUser?.account as Required<
    Pick<FarcasterBody, 'bio' | 'username' | 'displayName' | 'pfpUrl' | 'fid'>
  >;

  return (
    <PageWrapper>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5' align='center'>
          Onchain Summer
        </Typography>
        <FarcasterCard
          fid={farcasterDetails.fid}
          name={farcasterDetails.displayName}
          username={farcasterDetails.username}
          avatar={farcasterDetails.pfpUrl}
          bio={farcasterDetails.bio}
        />
        <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
          <Link href='/create-project' passHref>
            <Button startIcon={<AddIcon fontSize='small' />} size='large'>
              Create a project
            </Button>
          </Link>
        </Box>
        <Typography variant='h6'>Your Projects</Typography>
        <ProjectsList userProjects />
      </Box>
    </PageWrapper>
  );
}

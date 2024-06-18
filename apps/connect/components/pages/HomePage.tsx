import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Suspense } from 'react';

import { PageWrapper } from 'components/common/PageWrapper';
import { WarpcastLogin } from 'components/farcaster/WarpcastLogin';
import { ProjectItemSkeleton } from 'components/projects/ProjectItemSkeleton';
import { ProjectsList } from 'components/projects/ProjectsList';

export function HomePage({ user }: { user: any }) {
  return (
    <PageWrapper>
      <Box textAlign='center'>
        <Typography variant='h3' component='h1' my={2}>
          Onchain Summer
        </Typography>
        <Typography variant='body2' mb={4}>
          Powered by CharmVerse
        </Typography>
        <Typography>Create your profile, add projects and compete for 540K OP in total prizes on Gitcoin.</Typography>
        {/* <WarpcastLogin /> */}
        <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
          <Button>Connect with Farcaster</Button>
          <Link href='https://warpcast.com' target='_blank' rel='noopener'>
            Don't have a Farcaster acccount?
          </Link>
        </Box>
      </Box>
      <Divider />
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5'>Recent Projects</Typography>
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList />
        </Suspense>
      </Box>
    </PageWrapper>
  );
}

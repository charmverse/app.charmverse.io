import { PageWrapper } from '@connect/components/common/PageWrapper';
import { WarpcastLogin } from '@connect/components/common/WarpcastLogin/WarpcastLogin';
import { ProjectItemSkeleton } from '@connect/components/projects/ProjectItemSkeleton';
import { ProjectsList } from '@connect/components/projects/ProjectsList';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Suspense } from 'react';

export function HomePage() {
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

        <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
          <WarpcastLogin />

          <MuiLink href='https://warpcast.com' target='_blank' rel='noopener'>
            Don't have a Farcaster acccount?
          </MuiLink>
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

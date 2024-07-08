import { PageTitle } from '@connect/components/common/PageTitle';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { WarpcastLogin } from '@connect/components/common/WarpcastLogin/WarpcastLogin';
import { ProjectItemSkeleton } from '@connect/components/projects/components/ProjectItemSkeleton';
import { ProjectsList } from '@connect/components/projects/components/ProjectsList';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Suspense } from 'react';

export function HomePage() {
  return (
    <PageWrapper>
      <Box data-test='connect-home-page' display='flex' gap={2} flexDirection='column'>
        <PageTitle>Onchain Summer</PageTitle>
        <Typography align='center' my={2}>
          Create your profile, add projects and compete for 540K OP in total prizes on Gitcoin.
        </Typography>
        <Box gap={1} display='flex' flexDirection='column' alignItems='center'>
          <WarpcastLogin />
          <MuiLink href='https://warpcast.com' target='_blank' rel='noopener'>
            <Typography variant='caption'>Don't have a Farcaster account?</Typography>
          </MuiLink>
        </Box>
        <Divider />
      </Box>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5'>Recent Projects</Typography>
        <Suspense fallback={<ProjectItemSkeleton />}>
          <ProjectsList />
        </Suspense>
        <Typography align='left' variant='caption' component='p'>
          Powered by CharmVerse
        </Typography>
      </Box>
    </PageWrapper>
  );
}

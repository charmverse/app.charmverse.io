import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { WarpcastLogin } from 'components/farcaster/WarpcastLogin';
import { ProjectsList } from 'components/projects/ProjectsList';

export function HomePage({ user }: { user: any }) {
  return (
    <Box>
      <Box textAlign='center'>
        <Typography variant='h1' my={2}>
          Onchain Summer
        </Typography>
        <Typography variant='body2'>Powered by CharmVerse</Typography>
        <Typography>Create your profile, add projects and compete for 540K OP in total prizes on Gitcoin.</Typography>
        {/* <WarpcastLogin /> */}
        <Link href='https://warpcast.com' target='_blank' rel='noopener'>
          Don't have a Farcaster acccount?
        </Link>
        <Divider />
        <Typography variant='h3'>Recent Projects</Typography>
        <ProjectsList />
      </Box>
    </Box>
  );
}

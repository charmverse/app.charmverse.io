'use client';

import { Typography, Paper, Box } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Link from 'next/link';

export function BuilderPageInviteCard() {
  const { user } = useUser();

  const isDesktop = useMdScreen();

  if (user && user.builderStatus !== null) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: {
          xs: 1,
          md: 3
        },
        my: {
          xs: 0.5,
          md: 1
        },
        display: 'flex',
        flexDirection: 'column',
        gap: {
          xs: 0.75,
          md: 2
        }
      }}
    >
      <Typography variant={isDesktop ? 'h5' : 'body1'} fontWeight={600} color='secondary' textAlign='center'>
        Are you a Developer?
      </Typography>
      <Typography variant={isDesktop ? 'h6' : 'subtitle2'} fontWeight={400}>
        Do you regularly contribute to open source onchain repositories?
      </Typography>
      <Typography variant={isDesktop ? 'h6' : 'subtitle2'} fontWeight={400}>
        Scout Game rewards Builders for contributing to the onchain ecosystem.
      </Typography>

      <Box display='flex' justifyContent='center'>
        <Link href={!user ? '/login' : '/welcome/builder'}>
          <Typography variant={isDesktop ? 'h6' : 'subtitle2'} fontWeight={400} color='primary'>
            Learn more
          </Typography>
        </Link>
      </Box>
    </Paper>
  );
}

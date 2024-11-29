'use client';

import { Link, Typography, Paper } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

export function BuilderPageInviteCard() {
  const isDesktop = useMdScreen();
  return (
    <Paper
      sx={{
        p: {
          xs: 1,
          md: 3
        },
        mx: {
          xs: 0,
          md: 1
        },
        my: {
          xs: 0.5,
          md: 2
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
      <Typography variant={isDesktop ? 'h6' : 'subtitle2'} fontWeight={400} color='primary' textAlign='center'>
        <Link href='/builders'>Learn more</Link>
      </Typography>
    </Paper>
  );
}

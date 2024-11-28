import { Grid2 as Grid, Stack, Typography } from '@mui/material';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { Suspense } from 'react';

import { LoadingTable } from 'components/common/Loading/LoadingTable';
import { HomeTab } from 'components/home/components/HomePageTable/HomePageTable';

export function BuildersPage({ tab, week }: { tab: string; week: string }) {
  return (
    <>
      <HeaderMessage />
      <Grid container spacing={1} height='calc(100vh - 100px)'>
        <Grid size={{ xs: 12, md: 7 }} sx={{ height: '100%', overflowX: 'hidden', p: 2, gap: 2 }}>
          <Stack height='350px'>
            <Typography variant='h5' color='secondary' textAlign='center'>
              Partner Rewards
            </Typography>
          </Stack>
          <Stack>
            <Typography variant='h5' color='secondary' textAlign='center'>
              Leaderboard
            </Typography>
            <Suspense key='leaderboard' fallback={<LoadingTable />}>
              <HomeTab tab='leaderboard' week={week} />
            </Suspense>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', overflowX: 'hidden' }}>
          <Stack>
            <Typography variant='h5' color='secondary' textAlign='center'>
              Recent Activity
            </Typography>
            <Suspense key='activity' fallback={<LoadingTable />}>
              <HomeTab tab='activity' week={week} />
            </Suspense>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

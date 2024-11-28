import { Grid2 as Grid, Stack, Typography } from '@mui/material';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { Suspense } from 'react';

import { LoadingTable } from 'components/common/Loading/LoadingTable';

import { BuilderPageTable } from './BuilderPageTable/BuilderPageTable';
import { PartnerRewardsCarousel } from './PartnerRewardsCarousel/PartnerRewardsCarousel';

export function BuildersPage({ week }: { week: string }) {
  return (
    <>
      <HeaderMessage />
      <Grid container spacing={1} height='calc(100vh - 100px)'>
        <Grid size={{ xs: 12, md: 7 }} sx={{ height: '100%', overflowX: 'hidden', px: 1, gap: 2 }}>
          <Stack height='350px'>
            <Typography variant='h5' color='secondary' textAlign='center' my={1}>
              Partner Rewards
            </Typography>
            <PartnerRewardsCarousel />
          </Stack>
          <Stack>
            <Typography variant='h5' color='secondary' textAlign='center' my={1}>
              Leaderboard
            </Typography>
            <Suspense key='leaderboard' fallback={<LoadingTable />}>
              <BuilderPageTable tab='leaderboard' week={week} />
            </Suspense>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }} sx={{ pr: 1, height: '100%', overflowX: 'hidden' }}>
          <Stack>
            <Typography variant='h5' color='secondary' textAlign='center' my={1}>
              Recent Activity
            </Typography>
            <Suspense key='activity' fallback={<LoadingTable />}>
              <BuilderPageTable tab='activity' week={week} />
            </Suspense>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

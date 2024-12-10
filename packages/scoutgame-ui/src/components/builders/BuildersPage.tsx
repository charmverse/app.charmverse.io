import 'server-only';

import { Grid2 as Grid, Stack, Typography } from '@mui/material';
import { Suspense } from 'react';

import { HeaderMessage } from '../common/Header/HeaderMessage';
import { LoadingTable } from '../common/Loading/LoadingTable';
import { TabsMenu, type TabItem } from '../common/Tabs/TabsMenu';

import { BuilderPageInviteCard } from './BuilderInviteCard/BuilderInviteCard';
import { BuilderPageTable } from './BuilderPageTable/BuilderPageTable';
import { PartnerRewardsCarousel } from './PartnerRewardsCarousel/PartnerRewardsCarousel';

export const mobileTabOptions: TabItem[] = [
  { label: 'Leaderboard', value: 'leaderboard' },
  { label: 'Recent Activity', value: 'activity' }
];

export function BuildersPage({ week, tab }: { week: string; tab: string }) {
  return (
    <>
      <HeaderMessage />
      <Grid
        container
        spacing={1}
        height={{
          md: 'calc(100vh - 100px)',
          xs: 'calc(100vh - 165px)'
        }}
      >
        <Grid size={{ xs: 12, md: 8 }} sx={{ height: '100%', overflowX: 'hidden', px: 1, gap: 2 }}>
          <Stack
            height={{ xs: 180, md: 350 }}
            sx={{
              '& .swiper-button-next, & .swiper-button-prev': {
                height: 250,
                top: 125
              }
            }}
          >
            <Typography fontSize={{ xs: 16, md: 22 }} color='secondary' textAlign='center' my={{ xs: 0.5, md: 1 }}>
              Partner Rewards
            </Typography>
            <PartnerRewardsCarousel />
          </Stack>
          <Stack sx={{ display: { xs: 'block', md: 'none' } }}>
            <BuilderPageInviteCard />
          </Stack>
          <Stack display={{ xs: 'none', md: 'block' }}>
            <Typography variant='h5' color='secondary' textAlign='center' my={1}>
              Leaderboard
            </Typography>
            <Suspense key='leaderboard' fallback={<LoadingTable />}>
              <BuilderPageTable tab='leaderboard' week={week} />
            </Suspense>
          </Stack>
          <Stack display={{ xs: 'block', md: 'none' }}>
            <TabsMenu value={tab} tabs={mobileTabOptions} queryKey='tab' />
            <Suspense key={tab} fallback={<LoadingTable />}>
              <BuilderPageTable tab={tab} week={week} />
            </Suspense>
          </Stack>
        </Grid>
        <Grid size={4} sx={{ pr: 1, height: '100%', overflowX: 'hidden', display: { xs: 'none', md: 'block' } }}>
          <Stack sx={{ display: { xs: 'none', md: 'block' } }}>
            <BuilderPageInviteCard />
          </Stack>
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

import { Box, Stack, Typography } from '@mui/material';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { LoadingCards } from '@packages/scoutgame-ui/components/common/Loading/LoadingCards';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/home/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';
import Image from 'next/image';
import { Suspense } from 'react';

import { LoadingTable } from 'components/common/Loading/LoadingTable';

import { HomeTabsMenu, homeTabs } from './components/HomePageTable/components/HomeTabsMenu';
import { HomeTab } from './components/HomePageTable/HomePageTable';

export function HomePage({ tab }: { tab: string }) {
  const currentTab = homeTabs.some((t) => t.value === tab) ? tab : 'leaderboard';
  return (
    <>
      <HeaderMessage />
      <Stack
        sx={{
          width: '100%',
          height: 'calc(100vh - 100px)',
          overflowY: 'scroll'
        }}
        data-test='home-page'
      >
        <Stack flexDirection='row' alignItems='center' justifyContent='center' px={2} py={3}>
          <Image src='/images/profile/icons/blue-fire-icon.svg' width='30' height='30' alt='title icon' />
          <Typography variant='h5' textAlign='center'>
            Scout Today's HOT Builders
          </Typography>
        </Stack>
        <Suspense key='todays-hot-builders' fallback={<LoadingCards />}>
          <TodaysHotBuildersCarousel showPromoCards />
        </Suspense>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'background.default',
            zIndex: 1000
          }}
        >
          <HomeTabsMenu tab={currentTab} />
        </Box>
        <Suspense key={currentTab} fallback={<LoadingTable />}>
          <HomeTab tab={currentTab} />
        </Suspense>
      </Stack>
    </>
  );
}

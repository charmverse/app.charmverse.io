import { Box, Stack, Typography, Container } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { HeaderMessage } from 'components/common/Header/components/HeaderMessage';
import { LoadingCards } from 'components/common/Loading/LoadingCards';
import { LoadingTable } from 'components/common/Loading/LoadingTable';
import { TodaysHotBuildersCarousel } from 'components/home/components/BuildersCarousel/TodaysHotBuildersCarousel';
import { HomeTabsMenu } from 'components/home/components/HomePageTable/components/HomeTabsMenu';

import { homeTabs } from './components/HomePageTable/components/HomeTabsMenu';
import { HomeTab } from './components/HomePageTable/HomePageTable';

export function HomePage({ tab }: { tab: string }) {
  const currentTab = homeTabs.some((t) => t.value === tab) ? tab : 'leaderboard';
  return (
    <>
      <HeaderMessage />
      <Container
        sx={{ px: '0 !important', height: 'calc(100vh - 100px)', overflowY: 'scroll' }}
        maxWidth='xl'
        data-test='home-page'
      >
        <Stack flexDirection='row' alignItems='center' justifyContent='center' px={2} py={3}>
          <Image src='/images/profile/icons/blue-fire-icon.svg' width='30' height='30' alt='title icon' />
          <Typography variant='h5' textAlign='center'>
            Scout Today's HOT Builders
          </Typography>
        </Stack>
        <Suspense key={currentTab} fallback={<LoadingCards />}>
          <TodaysHotBuildersCarousel />
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
      </Container>
    </>
  );
}

import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { TodaysHotBuildersCarousel } from 'components/builder/Carousel/TodaysHotBuildersCarousel';
import { HeaderMessage } from 'components/common/Header/components/HeaderMessage';
import { HomeTabsMenu } from 'components/home/components/HomeTabsMenu';
import { LoadingBanner } from 'components/layout/Loading/LoadingBanner';

import { HomeTab } from './components/HomeTab';
import { homeTabs } from './components/HomeTabsMenu';

export async function HomePage({ user, tab }: { user: Scout | null; tab: string }) {
  const currentTab = homeTabs.some((t) => t.value === tab) ? tab : 'leaderboard';
  return (
    <>
      <Suspense fallback={<LoadingBanner />}>
        <HeaderMessage />
      </Suspense>
      <Box p={1}>
        <Stack flexDirection='row' alignItems='center' justifyContent='center' px={2} py={3}>
          <Image src='/images/profile/icons/blue-fire-icon.svg' width='30' height='30' alt='title icon' />
          <Typography variant='h5' textAlign='center'>
            Scout Today's HOT Builders
          </Typography>
        </Stack>
        <TodaysHotBuildersCarousel />
        <HomeTabsMenu tab={currentTab} />
        <HomeTab tab={currentTab} />
      </Box>
    </>
  );
}

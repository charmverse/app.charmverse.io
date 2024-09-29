import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Stack, Typography, Container } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { HeaderMessage } from 'components/common/Header/components/HeaderMessage';
import { LoadingCards } from 'components/common/Loading/LoadingCards';
import { LoadingTable } from 'components/common/Loading/LoadingTable';
import { TodaysHotBuildersCarousel } from 'components/home/components/BuildersCarousel/TodaysHotBuildersCarousel';
import { HomeTabsMenu } from 'components/home/components/HomeTabsMenu';

import { HomeTab } from './components/HomeTab';
import { homeTabs } from './components/HomeTabsMenu';

export async function HomePage({ user, tab }: { user: Scout | null; tab: string }) {
  const currentTab = homeTabs.some((t) => t.value === tab) ? tab : 'leaderboard';
  return (
    <>
      <HeaderMessage />
      <Container sx={{ px: '0 !important' }} maxWidth='xl' data-test='home-page'>
        <Stack flexDirection='row' alignItems='center' justifyContent='center' px={2} py={3}>
          <Image src='/images/profile/icons/blue-fire-icon.svg' width='30' height='30' alt='title icon' />
          <Typography variant='h5' textAlign='center'>
            Scout Today's HOT Builders
          </Typography>
        </Stack>
        <Suspense fallback={<LoadingCards />}>
          <TodaysHotBuildersCarousel />
        </Suspense>
        <HomeTabsMenu tab={currentTab} />
        <Suspense fallback={<LoadingTable />}>
          <HomeTab tab={currentTab} />
        </Suspense>
      </Container>
    </>
  );
}

import 'server-only';

import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { TodaysHotBuildersCarousel } from 'components/builder/Carousel/TodaysHotBuildersCarousel';
import { HeaderMessage } from 'components/common/Header/components/HeaderMessage';
import { HomeTab } from 'components/common/Tabs/HomeTab';
import { HomeTabsMenu } from 'components/common/Tabs/HomeTabsMenu';
import { LoadingBanner } from 'components/layout/Loading/LoadingBanner';
import { LoadingCards } from 'components/layout/Loading/LoadingCards';

export async function HomePage({ tab }: { tab: string }) {
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
        <Suspense fallback={<LoadingCards />}>
          <TodaysHotBuildersCarousel />
        </Suspense>
        <HomeTabsMenu tab={tab} />
        <HomeTab tab={tab} />
      </Box>
    </>
  );
}

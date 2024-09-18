import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';

import { CarouselContainer } from 'components/common/Carousel/CarouselContainer';
import { HeaderMessage } from 'components/common/Header/components/HeaderMessage';
import { HomeTab } from 'components/common/Tabs/HomeTab';
import { HomeTabsMenu } from 'components/common/Tabs/HomeTabsMenu';
import { LoadingTable } from 'components/layout/Loading/LoadingTable';

export async function HomePage({ user, tab }: { user: Scout | null; tab: string }) {
  return (
    <>
      <Suspense fallback={null}>
        <HeaderMessage />
      </Suspense>
      <Box p={1}>
        <Stack flexDirection='row' alignItems='center' justifyContent='center' px={2} py={3}>
          <Image src='/images/profile/icons/blue-fire-icon.svg' width='30' height='30' alt='title icon' />
          <Typography variant='h5' textAlign='center'>
            Scout Today's HOT Builders
          </Typography>
        </Stack>
        <Suspense fallback={null}>
          <CarouselContainer />
        </Suspense>
        <HomeTabsMenu tab={tab} />
        <Suspense fallback={<LoadingTable />} key={tab}>
          <HomeTab tab={tab} />
        </Suspense>
      </Box>
    </>
  );
}

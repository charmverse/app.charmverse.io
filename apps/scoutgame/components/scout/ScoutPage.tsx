import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense, useState } from 'react';

import { CarouselContainer } from 'components/common/Carousel/CarouselContainer';
import { HeaderMessage } from 'components/common/Header/components/HeaderMessage';
import { HomeTab } from 'components/home/components/HomeTab';
import { LoadingBanner } from 'components/layout/Loading/LoadinBanner';
import { LoadingCards } from 'components/layout/Loading/LoadingCards';
import { LoadingTable } from 'components/layout/Loading/LoadingTable';

import { SearchBuildersInput } from './components/SearchBuildersInput';
import { SortOptionTabs, sortOptions } from './components/SortOptionTabs';

export async function ScoutPage({ user, sort }: { user: Scout | null; sort: string }) {
  const currentSort = sortOptions.some((t) => t.value === sort) ? sort : 'top';

  return (
    <Box p={1}>
      <SearchBuildersInput />
      <SortOptionTabs value={currentSort} />
      {/* <Suspense fallback={<LoadingCards />}>
        <CarouselContainer />
      </Suspense> */}
      {/* <HomeTab tab={tab} /> */}
    </Box>
  );
}

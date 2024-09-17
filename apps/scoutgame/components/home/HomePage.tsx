import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense, type ReactNode } from 'react';

import { CarouselContainer } from 'components/common/Carousel/CarouselContainer';
import { HomeTabs } from 'components/common/Tabs/HomeTabs';

export async function HomePage({ user, children }: { user: Scout | null; children: ReactNode }) {
  return (
    <Box>
      <Stack flexDirection='row' alignItems='center' justifyContent='center' px={2} py={3}>
        <Image src='/images/profile/icons/blue-fire-icon.svg' width='30' height='30' alt='title icon' />
        <Typography variant='h5' textAlign='center'>
          Scout Today's HOT Builders
        </Typography>
      </Stack>
      <Suspense fallback={null}>
        <CarouselContainer />
      </Suspense>
      <HomeTabs />
      {children}
    </Box>
  );
}

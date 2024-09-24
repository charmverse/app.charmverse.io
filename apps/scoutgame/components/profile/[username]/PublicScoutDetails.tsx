import 'server-only';

import { Stack, Typography } from '@mui/material';
import { Suspense } from 'react';

import { BuildersGallery } from 'components/builder/BuildersGallery';
import { LoadingPaperSection } from 'components/layout/Loading/LoadingPaperSection';

import { PublicScoutStats } from './PublicScoutStats';

export async function PublicScoutDetails() {
  return (
    <Stack>
      <Suspense fallback={<LoadingPaperSection />}>
        <PublicScoutStats />
      </Suspense>
      <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
        Scouted Builders
      </Typography>
      <Suspense fallback={<LoadingPaperSection />}>
        <BuildersGallery builders={[]} />
      </Suspense>
    </Stack>
  );
}

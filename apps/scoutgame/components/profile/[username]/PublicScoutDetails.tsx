import 'server-only';

import { Stack, Typography } from '@mui/material';
import { delay } from '@root/lib/utils/async';
import { Suspense } from 'react';

import { LoadingPaperSection } from 'components/layout/Loading/LoadingPaperSection';

import { ScoutedBuilders } from '../../common/Builders/BuildersGallery';

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
        <ScoutedBuilders />
      </Suspense>
    </Stack>
  );
}

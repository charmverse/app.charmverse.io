import 'server-only';

import { Stack, Typography } from '@mui/material';
import { delay } from '@root/lib/utils/async';
import { Suspense } from 'react';

import { LoadingPaperSection } from 'components/layout/Loading/LoadingPaperSection';

import { PublicScoutStats } from './PublicScoutStats';
import { ScoutedBuilders } from './ScoutedBuilders';

export async function PublicScoutDetails() {
  await delay(3000);

  return (
    <Stack>
      <Suspense fallback={<LoadingPaperSection />}>
        <PublicScoutStats />
      </Suspense>
      <Typography variant='subtitle1' my={1} color='secondary' fontWeight='500'>
        Scouted Builders
      </Typography>
      <ScoutedBuilders />
    </Stack>
  );
}

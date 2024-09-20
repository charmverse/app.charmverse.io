import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack } from '@mui/material';
import { Suspense } from 'react';

import { BackButton } from 'components/common/Button/BackButton';
import { BuilderProfile } from 'components/common/Profile/BuilderProfile';
import { LoadingPaperSection } from 'components/layout/Loading/LoadingPaperSection';

import { PublicBuilderActivity } from '../PublicBuilderActivity';
import { PublicBuilderStats } from '../PublicBuilderStats';

import { PublicScoutedBy } from './PublicScoutedBy';

export async function BuilderTab({ user }: { user: Scout }) {
  return (
    <Box>
      <Paper sx={{ py: { xs: 1, md: 2 }, pr: { xs: 1, md: 2 } }}>
        <Stack flexDirection='row'>
          <BackButton />
          <BuilderProfile user={user} />
        </Stack>
      </Paper>
      <Suspense fallback={<LoadingPaperSection />}>
        <PublicBuilderStats />
      </Suspense>
      <Suspense fallback={<LoadingPaperSection />}>
        <PublicBuilderActivity />
      </Suspense>
      <Suspense fallback={<LoadingPaperSection />}>
        <PublicScoutedBy />
      </Suspense>
    </Box>
  );
}

import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { BackButton } from 'components/common/Button/BackButton';
import { BuilderProfile } from 'components/common/Profile/BuilderProfile';
import { LoadingPaperSection } from 'components/layout/Loading/LoadingPaperSection';
import { LoadingTable } from 'components/layout/Loading/LoadingTable';

import { PublicBuilderActivity } from '../PublicBuilderActivity';
import { PublicBuilderStats } from '../PublicBuilderStats';

export async function BuilderTab({ user }: { user: Scout }) {
  return (
    <Box>
      <Paper sx={{ py: 1, pr: 1 }}>
        <Stack flexDirection='row'>
          <BackButton />
          <BuilderProfile user={user} />
        </Stack>
      </Paper>
      <Suspense fallback={<LoadingPaperSection />}>
        <PublicBuilderStats />
      </Suspense>
      <Suspense
        fallback={
          <>
            <Skeleton variant='rounded' width={80} height={25} sx={{ my: 1 }} />
            <LoadingTable />
          </>
        }
      >
        <PublicBuilderActivity />
      </Suspense>
    </Box>
  );
}

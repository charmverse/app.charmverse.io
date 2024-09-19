import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack } from '@mui/material';
import { Suspense } from 'react';

import { BackButton } from 'components/common/Button/BackButton';
import { UserProfile } from 'components/common/Profile/UserProfile';
import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

import { ScoutPublicDetails } from '../ScoutPublicDetails';

export async function ScoutTab({ user }: { user: Scout }) {
  return (
    <Box>
      <Paper sx={{ py: 1 }}>
        <Stack flexDirection='row'>
          <BackButton />
          <UserProfile user={user} />
        </Stack>
      </Paper>
      <Stack my={2}>
        <Suspense fallback={<LoadingComponent />}>
          <ScoutPublicDetails />
        </Suspense>
      </Stack>
    </Box>
  );
}

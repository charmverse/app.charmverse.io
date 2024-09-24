import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { BuilderActivitiesList } from 'components/builder/BuilderActivitiesList';
import { BackButton } from 'components/common/Button/BackButton';
import { BuilderProfile } from 'components/common/Profile/BuilderProfile';
import { BuilderWeeklyStats } from 'components/profile/mine/BuilderProfile/BuilderWeeklyStats';
import { ScoutsGallery } from 'components/scout/ScoutsGallery';
import { getBuilderActivities } from 'lib/builders/getBuilderActivities';
import { getBuilderScouts } from 'lib/builders/getBuilderScouts';
import { getBuilderWeeklyStats } from 'lib/builders/getBuilderWeeklyStats';

export async function PublicBuilderProfile({ user }: { user: Scout }) {
  const builderWeeklyStats = await getBuilderWeeklyStats(user.id);
  const builderActivities = await getBuilderActivities(user.id);
  const { scouts } = await getBuilderScouts(user.id);

  return (
    <Box>
      <Paper sx={{ py: { xs: 1, md: 2 }, pr: { xs: 1, md: 2 } }}>
        <Stack flexDirection='row'>
          <BackButton />
          <BuilderProfile user={user} />
        </Stack>
      </Paper>
      <BuilderWeeklyStats gemsCollected={builderWeeklyStats.gemsCollected} rank={builderWeeklyStats.rank} />
      <BuilderActivitiesList activities={builderActivities} />
      <Stack gap={0.5}>
        <Typography color='secondary'>Scouted By</Typography>
        <ScoutsGallery scouts={scouts} />
      </Stack>
    </Box>
  );
}

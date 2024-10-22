import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack } from '@mui/material';

import { getPointsWithEvents } from 'lib/points/getPointsWithEvents';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { PointsTable } from './PointsTable';

export async function ClaimedPointsTable() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const { weeklyRewards } = await getPointsWithEvents({
    userId: user.id,
    isClaimed: true
  });

  return (
    <PointsTable
      emptyMessage='History yet to be made.'
      weeklyRewards={weeklyRewards}
      title={
        <Stack direction='row' alignItems='center' gap={0.5}>
          <CheckCircleIcon />
          Claimed
        </Stack>
      }
    />
  );
}

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack } from '@mui/material';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import { getPointsReceiptsRewards } from 'lib/points/getPointsReceiptsRewards';

import { PointsTable } from './PointsTable';

export async function ClaimedPointsTable() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const pointsReceiptRewards = await getPointsReceiptsRewards({
    userId: user.id,
    isClaimed: true
  });

  return (
    <PointsTable
      emptyMessage='History yet to be made.'
      pointsReceiptRewards={pointsReceiptRewards}
      title={
        <Stack direction='row' alignItems='center' gap={0.5}>
          <CheckCircleIcon />
          Claimed
        </Stack>
      }
    />
  );
}

import { getPointsReceiptsRewards } from '@packages/scoutgame/points/getPointsReceiptsRewards';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';

import { PointsTable } from './PointsTable';

export async function UnclaimedPointsTable() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const pointsReceiptRewards = await getPointsReceiptsRewards({
    userId: user.id,
    isClaimed: false
  });

  return (
    <PointsTable
      emptyMessage='Nice, you have claimed all of your rewards to date!'
      pointsReceiptRewards={pointsReceiptRewards}
      title='Unclaimed'
    />
  );
}

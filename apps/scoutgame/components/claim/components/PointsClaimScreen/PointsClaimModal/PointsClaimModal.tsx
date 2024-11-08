import { getUnclaimedPointsSource } from 'lib/points/getUnclaimedPointsSource';

import { PointsClaimBuilderModal } from './PointsClaimBuilderModal';
import { PointsClaimScoutModal } from './PointsClaimScoutModal';

export async function PointsClaimModal({
  userId,
  displayName,
  claimedPoints
}: {
  userId: string;
  displayName: string;
  claimedPoints: number;
}) {
  const { builders, builderPoints, repos } = await getUnclaimedPointsSource(userId);

  if (builderPoints !== 0) {
    return <PointsClaimBuilderModal repos={repos} displayName={displayName} claimedPoints={claimedPoints} />;
  }

  return <PointsClaimScoutModal claimedPoints={claimedPoints} displayName={displayName} builders={builders} />;
}

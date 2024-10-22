import type { Metadata } from 'next';

import { ClaimPage } from 'components/claim/ClaimPage';
import { getPointsWithEvents } from 'lib/points/getPointsWithEvents';
import { getCachedUserFromSession as getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Claim Points'
};

export default async function Claim() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const { totalPoints, weeklyRewards, bonusPartners } = await getPointsWithEvents({
    userId: user.id,
    isClaimed: false
  });

  return (
    <ClaimPage
      username={user.username}
      totalClaimablePoints={totalPoints}
      weeklyRewards={weeklyRewards}
      bonusPartners={bonusPartners}
    />
  );
}

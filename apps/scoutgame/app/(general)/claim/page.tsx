import type { Metadata } from 'next';

import { ClaimPage } from 'components/claim/ClaimPage';
import { getClaimablePointsWithEvents } from 'lib/points/getClaimablePointsWithEvents';
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

  const { totalClaimablePoints, weeklyRewards, bonusPartners } = await getClaimablePointsWithEvents(user.id);

  return (
    <ClaimPage
      username={user.username}
      totalClaimablePoints={totalClaimablePoints}
      weeklyRewards={weeklyRewards}
      bonusPartners={bonusPartners}
    />
  );
}

import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import type { Metadata } from 'next';

import { ClaimPage } from 'components/claim/ClaimPage';
import { getUnclaimedPointsSource } from 'lib/points/getUnclaimedPointsSource';
import { getCachedUserFromSession as getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Claim Points'
};

export default async function Claim({ searchParams }: { searchParams: { tab: string } }) {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const { bonusPartners, points } = await getClaimablePoints({ userId: user.id });
  const { builders, builderPoints, repos } = await getUnclaimedPointsSource(user.id);

  return (
    <ClaimPage
      builders={builders}
      builderPoints={builderPoints}
      repos={repos}
      period={searchParams.tab}
      displayName={user.displayName}
      totalUnclaimedPoints={points}
      bonusPartners={bonusPartners}
    />
  );
}

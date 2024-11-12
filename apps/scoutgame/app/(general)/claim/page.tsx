import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import type { Metadata } from 'next';

import { ClaimPage } from 'components/claim/ClaimPage';

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

  return (
    <ClaimPage
      period={searchParams.tab}
      displayName={user.displayName}
      totalUnclaimedPoints={points}
      bonusPartners={bonusPartners}
    />
  );
}

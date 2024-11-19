import { Box } from '@mui/material';
import { getClaimablePointsWithSources } from '@packages/scoutgame/points/getClaimablePointsWithSources';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { ClaimPage } from '@packages/scoutgame-ui/components/claim/ClaimPage';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Claim Points'
};

export default async function Claim({ searchParams }: { searchParams: { tab: string } }) {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const { bonusPartners, points, builders, repos } = await getClaimablePointsWithSources(user.id);

  return (
    <ClaimPage
      builders={builders}
      repos={repos}
      period={searchParams.tab}
      displayName={user.displayName}
      totalUnclaimedPoints={points}
      bonusPartners={bonusPartners}
    />
  );
}

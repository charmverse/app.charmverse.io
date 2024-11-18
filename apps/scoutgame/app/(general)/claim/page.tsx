import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { getUnclaimedPointsSource } from '@packages/scoutgame/points/getUnclaimedPointsSource';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { ClaimPage } from '@packages/scoutgame-ui/components/claim/ClaimPage';
import type { Metadata } from 'next';

import { PageContainer } from 'components/layout/PageContainer';

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
  const { builders, builderPoints, scoutPoints, repos } = await getUnclaimedPointsSource(user.id);

  return (
    <PageContainer>
      <ClaimPage
        builders={builders}
        builderPoints={builderPoints}
        scoutPoints={scoutPoints}
        period={searchParams.tab}
        displayName={user.displayName}
        totalUnclaimedPoints={points}
        bonusPartners={bonusPartners}
        repos={repos}
      />
    </PageContainer>
  );
}

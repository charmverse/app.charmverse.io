import { log } from '@charmverse/core/log';
import type { ProfileTab } from '@packages/scoutgame/components/profile/ProfilePage';
import { ProfilePage } from '@packages/scoutgame/components/profile/ProfilePage';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getUserStats } from '@packages/scoutgame/users/getUserStats';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PageContainer } from 'components/layout/PageContainer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'My Profile'
};

export default async function Profile({
  searchParams
}: {
  searchParams: {
    tab: ProfileTab;
  };
}) {
  const user = await getUserFromSession();
  const tab = searchParams.tab || (user?.builderStatus ? 'build' : 'scout');
  if (!user) {
    return null;
  }

  if ((tab as string) === 'win') {
    redirect('/claim');
  }

  if (!user.onboardedAt) {
    log.info('Redirect user to welcome page', { userId: user?.id });
    redirect('/welcome');
  }

  const userStats = await getUserStats(user.id);

  return (
    <PageContainer>
      <ProfilePage
        user={{
          ...user,
          ...userStats
        }}
        tab={tab}
      />
    </PageContainer>
  );
}

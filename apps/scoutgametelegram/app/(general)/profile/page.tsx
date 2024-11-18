import { log } from '@charmverse/core/log';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getUserStats } from '@packages/scoutgame/users/getUserStats';
import type { ProfileTab } from '@packages/scoutgame-ui/components/profile/ProfilePage';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ProfilePage } from 'components/profile/ProfilePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
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
  if (!user) {
    return null;
  }

  if (!user.onboardedAt) {
    log.info('Redirect user to welcome page', { userId: user?.id });
    redirect('/welcome');
  }

  const userStats = await getUserStats(user.id);

  return (
    <ProfilePage
      user={{
        ...user,
        ...userStats
      }}
    />
  );
}

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
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
  const userExternalProfiles = await prisma.scout.findUniqueOrThrow({
    where: {
      id: user.id
    },
    select: {
      hasMoxieProfile: true,
      talentProfile: {
        select: {
          id: true,
          score: true
        }
      }
    }
  });

  return (
    <ProfilePage
      user={{
        ...user,
        ...userStats,
        hasMoxieProfile: userExternalProfiles.hasMoxieProfile,
        talentProfile: userExternalProfiles.talentProfile ?? undefined
      }}
    />
  );
}

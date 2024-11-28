import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getUserStats } from '@packages/scoutgame/users/getUserStats';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
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
  const user = await getUserFromSession({ sameSite: 'none' });
  if (!user) {
    return null;
  }

  if (!user.onboardedAt) {
    log.info('Redirect user to welcome page', { userId: user?.id });
    redirect('/welcome');
  }

  const [, userStats] = await safeAwaitSSRData(getUserStats(user.id));
  const [, userExternalProfiles] = await safeAwaitSSRData(
    prisma.scout.findUniqueOrThrow({
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
    })
  );

  return (
    <ProfilePage
      user={{
        ...user,
        ...userStats,
        hasMoxieProfile: userExternalProfiles?.hasMoxieProfile ?? false,
        talentProfile: userExternalProfiles?.talentProfile ?? undefined
      }}
    />
  );
}

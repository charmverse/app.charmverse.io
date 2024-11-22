import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCachedUserFromSession as getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getUserStats } from '@packages/scoutgame/users/getUserStats';
import type { ProfileTab } from '@packages/scoutgame-ui/components/profile/ProfilePage';
import { ProfilePage } from '@packages/scoutgame-ui/components/profile/ProfilePage';
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
    <PageContainer>
      <ProfilePage
        user={{
          ...user,
          ...userStats,
          hasMoxieProfile: userExternalProfiles.hasMoxieProfile,
          talentProfile: userExternalProfiles.talentProfile ?? undefined
        }}
        tab={tab}
      />
    </PageContainer>
  );
}

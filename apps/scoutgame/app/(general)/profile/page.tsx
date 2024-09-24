import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import type { ProfileTab } from 'components/profile/mine/ProfilePage';
import { ProfilePage } from 'components/profile/mine/ProfilePage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

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
  const tab = (user?.githubUser ? 'build' : searchParams.tab) || 'scout';
  if (!user) {
    redirect('/');
  }

  if (!user.onboardedAt) {
    redirect('/welcome');
  }

  const seasonPoints = await prisma.userSeasonStats.findUnique({
    where: {
      userId_season: {
        userId: user.id,
        season: currentSeason
      }
    },
    select: {
      pointsEarnedAsBuilder: true,
      pointsEarnedAsScout: true
    }
  });

  const allTimePoints = await prisma.userAllTimeStats.findUnique({
    where: {
      userId: user.id
    },
    select: {
      pointsEarnedAsBuilder: true,
      pointsEarnedAsScout: true
    }
  });

  return (
    <ProfilePage
      user={{
        ...user,
        seasonPoints: {
          builderPoints: seasonPoints?.pointsEarnedAsBuilder || 0,
          scoutPoints: seasonPoints?.pointsEarnedAsScout || 0
        },
        allTimePoints: {
          builderPoints: allTimePoints?.pointsEarnedAsBuilder || 0,
          scoutPoints: allTimePoints?.pointsEarnedAsScout || 0
        }
      }}
      tab={tab}
    />
  );
}

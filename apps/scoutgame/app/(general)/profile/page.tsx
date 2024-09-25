import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import type { ProfileTab } from 'components/profile/mine/ProfilePage/ProfilePage';
import { ProfilePage } from 'components/profile/mine/ProfilePage/ProfilePage';
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
  const tab = searchParams.tab || (user?.githubUser ? 'build' : 'scout');
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
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        avatar: user.avatar || '',
        githubLogin: user.githubUser?.login,
        currentBalance: user.currentBalance,
        bio: user.bio,
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

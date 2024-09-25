import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import type { ProfileTab } from 'components/profile/mine/components/ProfilePage';
import { ProfilePage } from 'components/profile/mine/components/ProfilePage';
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
  const tab = searchParams.tab || (user?.builder ? 'build' : 'scout');
  if (!user) {
    return null;
  }

  if (!user.onboardedAt) {
    log.info('Redirect user to welcome page', { userId: user?.id });
    redirect('/welcome');
  }

  const [githubUser, seasonPoints, allTimePoints] = await Promise.all([
    prisma.githubUser.findFirst({
      where: {
        builderId: user.id
      },
      select: {
        login: true
      }
    }),
    prisma.userSeasonStats.findUnique({
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
    }),
    prisma.userAllTimeStats.findUnique({
      where: {
        userId: user.id
      },
      select: {
        pointsEarnedAsBuilder: true,
        pointsEarnedAsScout: true
      }
    })
  ]);

  return (
    <ProfilePage
      user={{
        ...user,
        githubLogin: githubUser?.login,
        seasonPoints: {
          builderPoints: seasonPoints?.pointsEarnedAsBuilder,
          scoutPoints: seasonPoints?.pointsEarnedAsScout
        },
        allTimePoints: {
          builderPoints: allTimePoints?.pointsEarnedAsBuilder,
          scoutPoints: allTimePoints?.pointsEarnedAsScout
        }
      }}
      tab={tab}
    />
  );
}

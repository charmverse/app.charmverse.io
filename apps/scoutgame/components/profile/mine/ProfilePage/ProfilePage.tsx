'use client';

import { useMdScreen } from 'hooks/useMediaScreens';
import type { BasicUserInfo } from 'lib/builders/interfaces';

import { DesktopProfilePage } from './DesktopProfilePage';
import { MobileProfilePage } from './MobileProfilePage';

export type ProfileTab = 'build' | 'scout' | 'win';

export type UserProfileWithPoints = BasicUserInfo & {
  seasonPoints: {
    builderPoints?: number;
    scoutPoints?: number;
  };
  allTimePoints: {
    builderPoints?: number;
    scoutPoints?: number;
  };
  currentBalance: number;
};

export type ProfilePageProps = {
  user: UserProfileWithPoints;
  tab: ProfileTab;
};

export async function ProfilePage({ user, tab }: ProfilePageProps) {
  const isDesktop = useMdScreen();

  return isDesktop ? <DesktopProfilePage user={user} tab={tab} /> : <MobileProfilePage user={user} tab={tab} />;
}

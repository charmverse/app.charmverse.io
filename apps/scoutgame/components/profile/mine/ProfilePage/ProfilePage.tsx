import type { UserProfileInfo } from 'components/common/Profile/UserProfile';
import { useMdScreen } from 'hooks/useMediaScreens';

import { DesktopProfilePage } from './DesktopProfilePage';
import { MobileProfilePage } from './MobileProfilePage';

export type ProfileTab = 'build' | 'scout' | 'win';

export type UserProfileWithPoints = UserProfileInfo & {
  seasonPoints: {
    builderPoints: number;
    scoutPoints: number;
  };
  allTimePoints: {
    builderPoints: number;
    scoutPoints: number;
  };
  currentBalance: number;
};

export type ProfilePageProps = {
  user: UserProfileWithPoints;
  tab: ProfileTab;
};

export async function ProfilePage({ user, tab }: ProfilePageProps) {
  return <DesktopProfilePage user={user} tab={tab} />;
}

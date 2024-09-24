'use client';

import type { UserProfileInfo } from 'components/common/Profile/UserProfile';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { DesktopPublicScoutProfile } from './DesktopPublicScoutProfile';
import { MobilePublicScoutProfile } from './MobilePublicScoutProfile';

export type ScoutProfileProps = {
  scout: UserProfileInfo;
  allTimePoints: number;
  seasonPoints: number;
  buildersScouted: number;
  nftsPurchased: number;
  scoutedBuilders: BuilderInfo[];
  tab: string;
};

export function PublicScoutProfileContainer(props: ScoutProfileProps) {
  const isDesktop = useMdScreen();

  if (isDesktop) {
    return <DesktopPublicScoutProfile {...props} />;
  }

  return <MobilePublicScoutProfile {...props} />;
}

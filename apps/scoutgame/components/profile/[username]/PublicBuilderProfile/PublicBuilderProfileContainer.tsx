'use client';

import type { ScoutInfo } from 'components/scout/ScoutCard';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';

import { DesktopPublicBuilderProfile } from './DesktopPublicBuilderProfile';
import { MobilePublicBuilderProfile } from './MobilePublicBuilderProfile';

export type BuilderProfileProps = {
  tab: string;
  builder: {
    avatar: string;
    username: string;
    displayName: string;
    price: number;
    githubLogin: string;
    bio: string;
  };
  builderId: string;
  allTimePoints: number;
  seasonPoints: number;
  totalScouts: number;
  scouts: ScoutInfo[];
  totalNftsSold: number;
  builderActivities: BuilderActivity[];
  gemsCollected: number;
  rank: number;
};

export function PublicBuilderProfileContainer(props: BuilderProfileProps) {
  const isDesktop = useMdScreen();

  if (isDesktop) {
    return <DesktopPublicBuilderProfile {...props} />;
  }

  return <MobilePublicBuilderProfile {...props} />;
}

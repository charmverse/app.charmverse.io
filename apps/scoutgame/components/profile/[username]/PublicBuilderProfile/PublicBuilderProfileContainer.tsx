'use client';

import type { ScoutInfo } from 'components/common/Card/ScoutCard';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderActivity } from 'lib/builders/getBuilderActivities';
import type { BasicUserInfo } from 'lib/builders/interfaces';

import { DesktopPublicBuilderProfile } from './DesktopPublicBuilderProfile';
import { MobilePublicBuilderProfile } from './MobilePublicBuilderProfile';

export type BuilderProfileProps = {
  tab: string;
  builder: BasicUserInfo & {
    price: bigint;
    isBuilder: boolean;
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

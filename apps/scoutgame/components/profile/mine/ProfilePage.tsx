import type { Scout } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import { Suspense } from 'react';

import { UserProfile } from 'components/common/Profile/UserProfile';

import { BuilderProfile } from './BuilderProfile/BuilderProfile';
import { PointsClaimScreen } from './PointsClaimScreen/PointsClaimScreen';
import { ProfilePointsCard } from './ProfilePointsCard';
import { ProfileTabs } from './ProfileTabs';
import { ScoutProfile } from './ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from './ScoutProfile/ScoutProfileLoading';

export type ProfileTab = 'build' | 'scout' | 'win';

export type ScoutProfile = Scout & {
  seasonPoints: {
    builderPoints: number;
    scoutPoints: number;
  };
  allTimePoints: {
    builderPoints: number;
    scoutPoints: number;
  };
};

export async function ProfilePage({ user, tab }: { user: ScoutProfile; tab: ProfileTab }) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      <UserProfile user={user} />
      <ProfilePointsCard
        seasonPoints={user.seasonPoints}
        allTimePoints={user.allTimePoints}
        points={user.seasonPoints.scoutPoints}
      />
      <Box my={2} margin='0 auto'>
        <ProfileTabs tab={tab} />
      </Box>
      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : null}>
        {tab === 'scout' ? (
          <ScoutProfile userId={user.id} />
        ) : tab === 'build' ? (
          <BuilderProfile builderId={user.id} />
        ) : (
          <PointsClaimScreen userId={user.id} username={user.username} />
        )}
      </Suspense>
    </Box>
  );
}

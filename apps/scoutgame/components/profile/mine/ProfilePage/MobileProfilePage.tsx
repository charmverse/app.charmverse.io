'use client';

import { Box } from '@mui/material';
import { Suspense } from 'react';

import { UserProfile } from 'components/common/Profile/UserProfile';

import { BuilderProfile } from '../BuilderProfile/BuilderProfile';
import { MobilePointsClaimScreen } from '../PointsClaimScreen/MobilePointsClaimScreen';
import { ProfilePointsCard } from '../ProfilePointsCard';
import { MobileProfileTabsMenu } from '../ProfileTabsMenu';
import { ScoutProfile } from '../ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from '../ScoutProfile/ScoutProfileLoading';

import type { ProfilePageProps } from './ProfilePage';

export async function MobileProfilePage({ user, tab }: ProfilePageProps) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      <UserProfile user={user} />
      <ProfilePointsCard
        seasonPoints={user.seasonPoints}
        allTimePoints={user.allTimePoints}
        points={user.currentBalance}
      />
      <Box my={2} margin='0 auto'>
        <MobileProfileTabsMenu tab={tab} />
      </Box>
      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : null}>
        {tab === 'scout' ? (
          <ScoutProfile userId={user.id} />
        ) : tab === 'build' ? (
          <BuilderProfile builderId={user.id} />
        ) : (
          <MobilePointsClaimScreen userId={user.id} username={user.username} />
        )}
      </Suspense>
    </Box>
  );
}

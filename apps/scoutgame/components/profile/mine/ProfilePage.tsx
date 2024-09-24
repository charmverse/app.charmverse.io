import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Tabs } from '@mui/material';
import { Suspense } from 'react';

import { UserProfile } from 'components/common/Profile/UserProfile';
import { LoadingCard } from 'components/layout/Loading/LoadingCard';
import { LoadingCards } from 'components/layout/Loading/LoadingCards';

import { ProfilePointsCard } from './ProfilePointsCard';
import { ProfileTabs } from './ProfileTabs';
import { ScoutProfile } from './ScoutProfile/ScoutProfile';

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
      <Suspense
        fallback={
          <>
            <LoadingCard />
            <LoadingCards />
          </>
        }
      >
        {tab === 'scout' ? <ScoutProfile userId={user.id} /> : null}
      </Suspense>
    </Box>
  );
}

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, Tabs } from '@mui/material';

import { UserProfile } from 'components/common/Profile/UserProfile';

import { ProfilePointsCard } from './ProfilePointsCard';
import { ProfileTabs } from './ProfileTabs';

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
    </Box>
  );
}

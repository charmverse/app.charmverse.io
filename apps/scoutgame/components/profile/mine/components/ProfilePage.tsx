import { Box, Paper, Stack } from '@mui/material';
import { Suspense } from 'react';

import { UserProfile } from 'components/common/Profile/UserProfile';
import type { BasicUserInfo } from 'lib/builders/interfaces';

import { ProfilePointsCard } from '../ProfilePointsCard';

import { BuilderProfile } from './BuilderProfile/BuilderProfile';
import { PointsClaimScreen } from './PointsClaimScreen/PointsClaimScreen';
import { ProfileTabsMenu } from './ProfileTabsMenu';
import { ScoutProfile } from './ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from './ScoutProfile/ScoutProfileLoading';

export type ProfileTab = 'build' | 'scout' | 'win' | 'scout-build';

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

export function ProfilePage({ user, tab }: ProfilePageProps) {
  return (
    <Box
      sx={{
        p: 1,
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1240px',
        margin: 'auto'
      }}
    >
      <Stack
        gap={2}
        mt={2}
        flexDirection={{
          xs: 'column-reverse',
          md: 'column'
        }}
      >
        <ProfileTabsMenu tab={tab} />
        <Paper
          sx={{
            display: 'flex',
            p: {
              xs: 0,
              md: 2
            },
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            backgroundColor: {
              xs: 'transparent',
              md: 'background.dark'
            }
          }}
          elevation={0}
        >
          <UserProfile user={user} />
          <ProfilePointsCard
            seasonPoints={user.seasonPoints}
            allTimePoints={user.allTimePoints}
            points={user.currentBalance}
          />
        </Paper>
      </Stack>

      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : null}>
        {tab === 'win' ? (
          <PointsClaimScreen userId={user.id} username={user.username} />
        ) : tab === 'scout' ? (
          <ScoutProfile userId={user.id} />
        ) : tab === 'build' ? (
          <BuilderProfile builderId={user.id} />
        ) : (
          <>
            <ScoutProfile userId={user.id} />
            <BuilderProfile builderId={user.id} />
          </>
        )}
      </Suspense>
    </Box>
  );
}

import { Box, Paper, Stack, Typography } from '@mui/material';
import { Suspense } from 'react';

import { UserProfile } from 'components/common/Profile/UserProfile';
import type { UserStats } from 'lib/users/getUserStats';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { BuilderProfile } from './components/BuilderProfile/BuilderProfile';
import { PointsClaimScreen } from './components/PointsClaimScreen/PointsClaimScreen';
import { ProfileStats } from './components/ProfileStats';
import { ProfileTabsMenu } from './components/ProfileTabsMenu';
import { ScoutProfile } from './components/ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from './components/ScoutProfile/ScoutProfileLoading';

export type ProfileTab = 'build' | 'scout' | 'win' | 'scout-build';

export type UserProfileWithPoints = BasicUserInfo &
  UserStats & {
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
        margin: 'auto'
      }}
      data-test='profile-page'
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
          <Stack justifyContent='center' flex={1}>
            <UserProfile user={user} />
          </Stack>
          <Box flex={1}>
            <ProfileStats
              seasonPoints={user.seasonPoints}
              allTimePoints={user.allTimePoints}
              points={user.currentBalance}
            />
          </Box>
        </Paper>
      </Stack>

      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : null}>
        {tab === 'win' ? (
          <PointsClaimScreen userId={user.id} username={user.username} />
        ) : tab === 'scout' ? (
          <ScoutProfile userId={user.id} />
        ) : tab === 'build' ? (
          <BuilderProfile builder={user} />
        ) : (
          <Stack flexDirection='row' gap={2}>
            <Paper
              sx={{
                flex: 1,
                p: 2,
                backgroundColor: 'background.dark'
              }}
            >
              <Typography variant='h6' color='text.secondary'>
                Scout
              </Typography>
              <ScoutProfile userId={user.id} />
            </Paper>
            <Paper
              sx={{
                flex: 1,
                p: 2,
                backgroundColor: 'background.dark'
              }}
            >
              <Typography variant='h6' color='text.secondary'>
                Build
              </Typography>
              <BuilderProfile builder={user} />
            </Paper>
          </Stack>
        )}
      </Suspense>
    </Box>
  );
}

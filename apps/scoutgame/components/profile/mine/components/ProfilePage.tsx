import { Box, Paper, Stack, Typography } from '@mui/material';
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
          <Box flex={1}>
            <UserProfile user={user} />
          </Box>
          <Box flex={1}>
            <ProfilePointsCard
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
          <BuilderProfile builderId={user.id} />
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
              <BuilderProfile builderId={user.id} />
            </Paper>
          </Stack>
        )}
      </Suspense>
    </Box>
  );
}

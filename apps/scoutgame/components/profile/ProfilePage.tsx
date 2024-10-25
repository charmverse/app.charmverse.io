import type { BuilderStatus } from '@charmverse/core/prisma';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { Suspense } from 'react';

import { LoadingComponent } from 'components/common/Loading/LoadingComponent';
import { UserProfile } from 'components/common/Profile/UserProfile';
import type { UserStats } from 'lib/users/getUserStats';
import type { BuilderUserInfo } from 'lib/users/interfaces';

import { PageContainer } from '../layout/PageContainer';

import { BuilderProfile } from './components/BuilderProfile/BuilderProfile';
import { ProfileStats } from './components/ProfileStats';
import { ProfileTabsMenu } from './components/ProfileTabsMenu';
import { ScoutProfile } from './components/ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from './components/ScoutProfile/ScoutProfileLoading';

export type ProfileTab = 'build' | 'scout' | 'scout-build';

export type UserProfileWithPoints = Omit<BuilderUserInfo, 'builderStatus'> &
  UserStats & {
    currentBalance: number;
    displayName: string;
    builderStatus: BuilderStatus | null;
  };

export type ProfilePageProps = {
  user: UserProfileWithPoints;
  tab: ProfileTab;
};

export function ProfilePage({ user, tab }: ProfilePageProps) {
  return (
    <PageContainer>
      <Box
        sx={{
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

        <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : <LoadingComponent isLoading />}>
          {tab === 'scout' ? (
            <ScoutProfile userId={user.id} />
          ) : tab === 'build' ? (
            <BuilderProfile builder={user as BuilderUserInfo} />
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
                <BuilderProfile builder={user as BuilderUserInfo} />
              </Paper>
            </Stack>
          )}
        </Suspense>
      </Box>
    </PageContainer>
  );
}

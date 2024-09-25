import { Box, Paper, Stack, Typography } from '@mui/material';
import { Suspense } from 'react';

import { UserProfile } from 'components/common/Profile/UserProfile';

import { BuilderProfile } from '../BuilderProfile/BuilderProfile';
import { DesktopPointsClaimScreen } from '../PointsClaimScreen/DesktopPointsClaimScreen';
import { ProfilePointsCard } from '../ProfilePointsCard';
import { DesktopProfileTabsMenu } from '../ProfileTabsMenu';
import { ScoutProfile } from '../ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from '../ScoutProfile/ScoutProfileLoading';

import type { ProfilePageProps } from './ProfilePage';

export async function DesktopProfilePage({ user, tab }: ProfilePageProps) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      <Box my={2} margin='0 auto'>
        <DesktopProfileTabsMenu tab={tab} />
      </Box>
      <Paper
        sx={{
          display: 'flex',
          p: 2,
          gap: 2,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <UserProfile user={user} />
        <ProfilePointsCard
          seasonPoints={user.seasonPoints}
          allTimePoints={user.allTimePoints}
          points={user.currentBalance}
        />
      </Paper>
      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : null}>
        {tab === 'win' ? (
          <DesktopPointsClaimScreen userId={user.id} username={user.username} />
        ) : (
          <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            <Box width='50%'>
              <Typography color='secondary' variant='h6'>
                Scout
              </Typography>
              <ScoutProfile userId={user.id} />
            </Box>
            <Box width='50%'>
              <Typography color='secondary' variant='h6'>
                Build
              </Typography>
              <BuilderProfile builderId={user.id} />
            </Box>
          </Stack>
        )}
      </Suspense>
    </Box>
  );
}

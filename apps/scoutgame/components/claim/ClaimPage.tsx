import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Stack } from '@mui/material';

import { PointsClaimScreen } from 'components/claim/components/PointsClaimScreen/PointsClaimScreen';
import type { WeeklyReward } from 'lib/points/getClaimablePointsWithEvents';

import { PageContainer } from '../layout/PageContainer';

import { BuilderRewardsTable } from './components/BuilderRewardsTable/BuilderRewardsTable';
import { PointsTable } from './components/PointsTable';

export type ClaimPageProps = {
  totalClaimablePoints: number;
  weeklyRewards: WeeklyReward[];
  bonusPartners: string[];
  username: string;
};

export function ClaimPage({ username, totalClaimablePoints, weeklyRewards, bonusPartners }: ClaimPageProps) {
  return (
    <PageContainer>
      <Box
        sx={{
          gap: 2,
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto'
        }}
        data-test='claim-page'
      >
        <Stack
          gap={2}
          mt={2}
          flexDirection={{
            xs: 'column-reverse',
            md: 'row'
          }}
        >
          <Stack flex={1} gap={4}>
            <PointsClaimScreen
              totalClaimablePoints={totalClaimablePoints}
              username={username}
              bonusPartners={bonusPartners}
            />
            <PointsTable
              weeklyRewards={weeklyRewards}
              title='Unclaimed'
              emptyMessage='Nice, you have claimed all of your rewards to date!'
            />
            <PointsTable
              emptyMessage='History yet to be made.'
              weeklyRewards={weeklyRewards}
              title={
                <Stack direction='row' alignItems='center' gap={0.5}>
                  <CheckCircleIcon />
                  Claimed
                </Stack>
              }
            />
          </Stack>
          <Stack flex={1}>
            <BuilderRewardsTable />
          </Stack>
        </Stack>
      </Box>
    </PageContainer>
  );
}

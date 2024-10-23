import { Stack } from '@mui/material';
import { Suspense } from 'react';

import { PointsClaimScreen } from 'components/claim/components/PointsClaimScreen/PointsClaimScreen';
import { LoadingComponent } from 'components/common/Loading/LoadingComponent';

import { PageContainer } from '../layout/PageContainer';

import { BuilderRewardsTable } from './components/BuilderRewardsTable/BuilderRewardsTable';
import { ClaimedPointsTable } from './components/PointsTable/ClaimedPointsTable';
import { UnclaimedPointsTable } from './components/PointsTable/UnclaimedPointsTable';

export type ClaimPageProps = {
  totalUnclaimedPoints: number;
  bonusPartners: string[];
  username: string;
  period: string;
};

export function ClaimPage({ username, totalUnclaimedPoints, bonusPartners, period }: ClaimPageProps) {
  return (
    <PageContainer>
      <Stack
        gap={8}
        mt={2}
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
      >
        <Stack flex={1} gap={4}>
          <PointsClaimScreen
            totalUnclaimedPoints={totalUnclaimedPoints}
            username={username}
            bonusPartners={bonusPartners}
          />
          <Suspense fallback={<LoadingComponent isLoading />}>
            <UnclaimedPointsTable />
          </Suspense>
          <Stack
            sx={{
              display: {
                xs: 'flex',
                md: 'none'
              }
            }}
          >
            <Suspense fallback={<LoadingComponent isLoading />}>
              <BuilderRewardsTable period={period} />
            </Suspense>
          </Stack>
          <Suspense fallback={<LoadingComponent isLoading />}>
            <ClaimedPointsTable />
          </Suspense>
        </Stack>
        <Stack
          sx={{
            flex: 1,
            display: {
              xs: 'none',
              md: 'flex'
            }
          }}
        >
          <Suspense fallback={<LoadingComponent isLoading />}>
            <BuilderRewardsTable period={period} />
          </Suspense>
        </Stack>
      </Stack>
    </PageContainer>
  );
}

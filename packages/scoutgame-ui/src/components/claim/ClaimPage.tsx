import { Stack } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { Suspense } from 'react';

import { LoadingTable } from '../common/Loading/LoadingTable';

import { BuilderRewardsScreen } from './components/BuilderRewardsScreen/BuilderRewardsScreen';
import { PointsClaimScreen } from './components/PointsClaimScreen/PointsClaimScreen';
import { ClaimedPointsTable } from './components/PointsTable/ClaimedPointsTable';
import { UnclaimedPointsTable } from './components/PointsTable/UnclaimedPointsTable';

export type ClaimPageProps = {
  totalUnclaimedPoints: number;
  bonusPartners: BonusPartner[];
  displayName: string;
  period: string;
  builders: {
    avatar: string | null;
    displayName: string;
  }[];
  repos: string[];
};

export function ClaimPage({
  displayName,
  totalUnclaimedPoints,
  bonusPartners,
  period,
  builders,
  repos
}: ClaimPageProps) {
  return (
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
          displayName={displayName}
          bonusPartners={bonusPartners}
          builders={builders}
          repos={repos}
        />
        {totalUnclaimedPoints === 0 ? null : (
          <Suspense fallback={<LoadingTable />}>
            <UnclaimedPointsTable />
          </Suspense>
        )}
        <Stack
          sx={{
            display: {
              xs: 'flex',
              md: 'none'
            }
          }}
        >
          <BuilderRewardsScreen period={period} />
        </Stack>
        <Suspense fallback={<LoadingTable />}>
          <ClaimedPointsTable />
        </Suspense>
      </Stack>
      <Stack
        sx={{
          flex: 1,
          height: 'fit-content',
          justifyContent: 'flex-start',
          display: {
            xs: 'none',
            md: 'flex'
          }
        }}
      >
        <BuilderRewardsScreen period={period} />
      </Stack>
    </Stack>
  );
}

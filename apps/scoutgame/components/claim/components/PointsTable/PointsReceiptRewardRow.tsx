import { Stack, TableCell, TableRow, Typography } from '@mui/material';
import Image from 'next/image';

import type {
  BuilderPointsReceiptReward,
  LeaderboardRankPointsReceiptReward,
  PointsReceiptReward,
  SoldNftsPointsReceiptReward
} from 'lib/points/getPointsReceiptsRewards';

import { DividerRow } from '../common/DividerRow';
import { PointsCell } from '../common/PointsCell';

function getOrdinal(n: number): string {
  const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { zero: '', one: 'st', two: 'nd', few: 'rd', many: 'th', other: 'th' }[ordinal];
  return `${n}${suffix}`;
}

function BuilderRewardRow({ builderReward }: { builderReward: BuilderPointsReceiptReward }) {
  return (
    <>
      <DividerRow />
      <TableRow key={`${builderReward.weekNumber}builder-rewards`}>
        <TableCell
          align='left'
          sx={{
            width: {
              xs: 175,
              md: 225
            }
          }}
        >
          <Typography>Builder rewards</Typography>
        </TableCell>
        <TableCell align='center'>
          <Typography>{builderReward.weekNumber}</Typography>
        </TableCell>
        <TableCell align='right'>
          <PointsCell points={builderReward.points} />
        </TableCell>
      </TableRow>
    </>
  );
}

function LeaderboardRankRewardRow({
  leaderboardRankReward
}: {
  leaderboardRankReward: LeaderboardRankPointsReceiptReward;
}) {
  return (
    <>
      <DividerRow />
      <TableRow key={`${leaderboardRankReward.weekNumber}rank`}>
        <TableCell
          align='left'
          sx={{
            width: {
              xs: 175,
              md: 225
            }
          }}
        >
          <Typography>Finished {getOrdinal(leaderboardRankReward.rank)}</Typography>
        </TableCell>
        <TableCell align='center'>
          <Typography>{leaderboardRankReward.weekNumber}</Typography>
        </TableCell>
        <TableCell align='right'>
          <PointsCell points={leaderboardRankReward.points} />
        </TableCell>
      </TableRow>
    </>
  );
}

function SoldNftsRewardRow({ soldNftsReward }: { soldNftsReward: SoldNftsPointsReceiptReward }) {
  return (
    <>
      <DividerRow />
      <TableRow key={`${soldNftsReward.weekNumber}sold-nft`}>
        <TableCell
          align='left'
          sx={{
            width: {
              xs: 175,
              md: 225
            }
          }}
        >
          <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
            <Typography>Sold {soldNftsReward.quantity}</Typography>
            <Image alt='card' src='/images/profile/icons/card.svg' width={18} height={18} />
          </Stack>
        </TableCell>
        <TableCell align='center'>
          <Typography>{soldNftsReward.weekNumber}</Typography>
        </TableCell>
        <TableCell align='right'>
          <PointsCell points={soldNftsReward.points} />
        </TableCell>
      </TableRow>
    </>
  );
}

export function PointsReceiptRewardRow({ pointsReceiptReward }: { pointsReceiptReward: PointsReceiptReward }) {
  if (pointsReceiptReward.type === 'builder') {
    return <BuilderRewardRow builderReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'leaderboard_rank') {
    return <LeaderboardRankRewardRow leaderboardRankReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'sold_nfts') {
    return <SoldNftsRewardRow soldNftsReward={pointsReceiptReward} />;
  }

  return null;
}

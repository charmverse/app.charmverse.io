import { Stack, TableCell, TableRow, Typography } from '@mui/material';
import { seasons } from '@packages/scoutgame/dates';
import type {
  BuilderPointsReceiptReward,
  LeaderboardRankPointsReceiptReward,
  PointsReceiptReward,
  SeasonPointsReceiptsReward,
  SoldNftsPointsReceiptReward
} from '@packages/scoutgame/points/getPointsReceiptsRewards';
import Image from 'next/image';

import { PointsCell } from '../common/PointsCell';

function getOrdinal(n: number): string {
  const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { zero: '', one: 'st', two: 'nd', few: 'rd', many: 'th', other: 'th' }[ordinal];
  return `${n}${suffix}`;
}

function BuilderRewardRow({ builderReward }: { builderReward: BuilderPointsReceiptReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>Builder rewards</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>{builderReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <PointsCell points={builderReward.points} />
      </TableCell>
    </TableRow>
  );
}

function LeaderboardRankRewardRow({
  leaderboardRankReward
}: {
  leaderboardRankReward: LeaderboardRankPointsReceiptReward;
}) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>Finished {getOrdinal(leaderboardRankReward.rank)}</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>{leaderboardRankReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <PointsCell points={leaderboardRankReward.points} />
      </TableCell>
    </TableRow>
  );
}

function SoldNftsRewardRow({ soldNftsReward }: { soldNftsReward: SoldNftsPointsReceiptReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>Sold {soldNftsReward.quantity}</Typography>
          <Image alt='card' src='/images/profile/icons/card.svg' width={18} height={18} />
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{soldNftsReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <PointsCell points={soldNftsReward.points} />
      </TableCell>
    </TableRow>
  );
}

function SeasonRewardRow({ seasonReward }: { seasonReward: SeasonPointsReceiptsReward }) {
  const seasonTitle = seasons.find((season) => season.start === seasonReward.season)?.title;
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>{seasonTitle}</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>-</Typography>
      </TableCell>
      <TableCell align='right'>
        <PointsCell points={seasonReward.points} />
      </TableCell>
    </TableRow>
  );
}

export function PointsReceiptRewardRow({ pointsReceiptReward }: { pointsReceiptReward: PointsReceiptReward }) {
  if (pointsReceiptReward.type === 'builder') {
    return <BuilderRewardRow builderReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'leaderboard_rank') {
    return <LeaderboardRankRewardRow leaderboardRankReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'sold_nfts') {
    return <SoldNftsRewardRow soldNftsReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'season') {
    return <SeasonRewardRow seasonReward={pointsReceiptReward} />;
  }

  return null;
}

import { Stack, TableCell, TableRow, Typography } from '@mui/material';
import Image from 'next/image';
import type { ReactNode } from 'react';

import type { WeeklyReward } from 'lib/points/getPointsWithEvents';

import { DividerRow } from '../common/DividerRow';
import { PointsCell } from '../common/PointsCell';

function getOrdinal(n: number): string {
  const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { zero: '', one: 'st', two: 'nd', few: 'rd', many: 'th', other: 'th' }[ordinal];
  return `${n}${suffix}`;
}

export function WeeklyPointsRows({ weeklyReward }: { weeklyReward: WeeklyReward }) {
  const rows: ReactNode[] = [];

  if (weeklyReward.rank) {
    rows.push(
      <>
        <DividerRow />
        <TableRow key={`${weeklyReward.weekNumber}rank`}>
          <TableCell
            align='left'
            sx={{
              width: {
                xs: 175,
                md: 225
              }
            }}
          >
            <Typography>Finished {getOrdinal(weeklyReward.rank)}</Typography>
          </TableCell>
          <TableCell align='center'>
            <Typography>{weeklyReward.weekNumber}</Typography>
          </TableCell>
          <TableCell align='right'>
            <PointsCell points={weeklyReward.githubContributionReward?.points || 0} />
          </TableCell>
        </TableRow>
      </>
    );
  }

  if (weeklyReward.builderReward) {
    rows.push(
      <>
        <DividerRow />

        <TableRow key={`${weeklyReward.weekNumber}builder-rewards`}>
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
            <Typography>{weeklyReward.weekNumber}</Typography>
          </TableCell>
          <TableCell align='right'>
            <PointsCell points={weeklyReward.builderReward.points} />
          </TableCell>
        </TableRow>
      </>
    );
  }

  if (weeklyReward.soldNftReward) {
    rows.push(
      <>
        <DividerRow />
        <TableRow key={`${weeklyReward.weekNumber}sold-nft`}>
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
              <Typography>Sold {weeklyReward.soldNftReward.quantity}</Typography>
              <Image alt='card' src='/images/profile/icons/card.svg' width={18} height={18} />
            </Stack>
          </TableCell>
          <TableCell align='center'>
            <Typography>{weeklyReward.weekNumber}</Typography>
          </TableCell>
          <TableCell align='right'>
            <PointsCell points={weeklyReward.soldNftReward.points} />
          </TableCell>
        </TableRow>
      </>
    );
  }

  return rows;
}

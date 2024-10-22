import { Stack, TableCell, TableRow, Typography } from '@mui/material';
import Image from 'next/image';
import type { ReactNode } from 'react';

import type { WeeklyReward } from 'lib/points/getPointsWithEvents';

function getOrdinal(n: number): string {
  const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { zero: '', one: 'st', two: 'nd', few: 'rd', many: 'th', other: 'th' }[ordinal];
  return `${n}${suffix}`;
}

function PointsCell({ points }: { points: number }) {
  return (
    <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
      <Typography>{points}</Typography>
      <Image alt='scout game icon' src='/images/profile/scout-game-icon.svg' width={20} height={20} />
    </Stack>
  );
}

function DividerRow() {
  return (
    <TableRow sx={{ backgroundColor: 'background.default' }}>
      <TableCell colSpan={3} sx={{ '&.MuiTableCell-root': { padding: 0.25, backgroundColor: 'inherit' } }} />
    </TableRow>
  );
}

export function WeeklyPointsRows({ weeklyReward }: { weeklyReward: WeeklyReward }) {
  const rows: ReactNode[] = [];

  if (weeklyReward.rank) {
    rows.push(
      <>
        <DividerRow />
        <TableRow key={`${weeklyReward.weekNumber}rank`}>
          <TableCell align='left' sx={{ width: 225 }}>
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
          <TableCell align='left' sx={{ width: 225 }}>
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
          <TableCell align='left' sx={{ width: 225 }}>
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

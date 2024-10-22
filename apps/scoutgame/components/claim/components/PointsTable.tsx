import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
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

function WeeklyPointsRows({ weeklyReward }: { weeklyReward: WeeklyReward }) {
  const rows: ReactNode[] = [];

  if (weeklyReward.rank) {
    rows.push(
      <TableRow key={`${weeklyReward.weekNumber}rank`} sx={{ mb: 1 }}>
        <TableCell align='left' sx={{ minWidth: 150 }}>
          <Typography>Finished {getOrdinal(weeklyReward.rank)}</Typography>
        </TableCell>
        <TableCell align='center'>
          <Typography>{weeklyReward.weekNumber}</Typography>
        </TableCell>
        <TableCell align='right'>
          <PointsCell points={weeklyReward.githubContributionReward?.points || 0} />
        </TableCell>
      </TableRow>
    );
  }

  if (weeklyReward.builderReward) {
    rows.push(
      <TableRow key={`${weeklyReward.weekNumber}builder-rewards`} sx={{ mb: 1 }}>
        <TableCell align='left' sx={{ minWidth: 150 }}>
          <Typography>Builder rewards</Typography>
        </TableCell>
        <TableCell align='center'>
          <Typography>{weeklyReward.weekNumber}</Typography>
        </TableCell>
        <TableCell align='right'>
          <PointsCell points={weeklyReward.builderReward.points} />
        </TableCell>
      </TableRow>
    );
  }

  if (weeklyReward.soldNftReward) {
    rows.push(
      <TableRow key={`${weeklyReward.weekNumber}sold-nft`} sx={{ mb: 1 }}>
        <TableCell align='left' sx={{ minWidth: 150 }}>
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
    );
  }

  return rows;
}

export function PointsTable({
  weeklyRewards,
  title,
  emptyMessage
}: {
  weeklyRewards: WeeklyReward[];
  title: ReactNode | string;
  emptyMessage: string;
}) {
  return (
    <Stack gap={0.5} alignItems='center'>
      <Typography variant='h6' color='secondary'>
        {title}
      </Typography>
      <Table>
        <TableHead
          sx={{
            backgroundColor: 'background.dark',
            '& .MuiTableCell-root': { padding: 1, px: 1.5, borderBottom: 'none' }
          }}
        >
          <TableRow sx={{ mb: 1 }}>
            <TableCell align='left'>ACTION</TableCell>
            <TableCell align='center'>WEEK</TableCell>
            <TableCell align='right'>POINTS</TableCell>
          </TableRow>
        </TableHead>
        {weeklyRewards.length ? (
          <TableBody
            sx={{
              backgroundColor: 'background.dark',
              '& .MuiTableCell-root': { p: 1, borderBottom: 'none', px: 1.5 }
            }}
          >
            {weeklyRewards.map((weeklyReward) => (
              <WeeklyPointsRows key={weeklyReward.weekNumber} weeklyReward={weeklyReward} />
            ))}
          </TableBody>
        ) : null}
      </Table>
      {weeklyRewards.length ? null : (
        <Paper
          sx={{
            width: '100%',
            px: 2.5,
            py: 4,
            display: 'flex',
            mt: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'background.dark'
          }}
        >
          <Typography variant='h6'>{emptyMessage}</Typography>
        </Paper>
      )}
    </Stack>
  );
}

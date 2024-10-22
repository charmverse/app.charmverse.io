import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Image from 'next/image';
import type { ReactNode } from 'react';

import type { WeeklyReward } from 'lib/points/getClaimablePointsWithEvents';

function WeeklyPointsRows({ weeklyReward }: { weeklyReward: WeeklyReward }) {
  const rows: ReactNode[] = [];

  if (weeklyReward.rank) {
    rows.push(
      <TableRow key={weeklyReward.weekNumber} sx={{ mb: 1 }}>
        <TableCell align='left'>Finished {weeklyReward.rank}</TableCell>
        <TableCell align='center'>{weeklyReward.week}</TableCell>
        <TableCell align='center'>{weeklyReward.githubContributionReward.points}</TableCell>
      </TableRow>
    );
  }

  if (weeklyReward.builderReward) {
    rows.push(
      <TableRow key={weeklyReward.weekNumber} sx={{ mb: 1 }}>
        <TableCell align='left'>Builder rewards</TableCell>
        <TableCell align='center'>{weeklyReward.week}</TableCell>
        <TableCell align='center'>{weeklyReward.builderReward.points}</TableCell>
      </TableRow>
    );
  }

  if (weeklyReward.soldNftReward) {
    rows.push(
      <TableRow key={weeklyReward.weekNumber} sx={{ mb: 1 }}>
        <TableCell align='left'>
          <Typography>Sold {weeklyReward.soldNftReward.quantity}</Typography>
        </TableCell>
        <TableCell align='center'>
          <Typography>{weeklyReward.week}</Typography>
        </TableCell>
        <TableCell align='center'>
          <Stack direction='row' alignItems='center' justifyContent='center' gap={0.5}>
            <Typography>{weeklyReward.soldNftReward.points}</Typography>
            <Image alt='scout game icon' src='/images/profile/scout-game-icon.svg' width={20} height={20} />
          </Stack>
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
            '& .MuiTableCell-root': { padding: 1, borderBottom: 'none', textTransform: 'uppercase' }
          }}
        >
          <TableRow sx={{ mb: 1 }}>
            <TableCell align='left'>Action</TableCell>
            <TableCell align='center'>Week</TableCell>
            <TableCell align='center'>Points</TableCell>
          </TableRow>
        </TableHead>
        {weeklyRewards.length ? (
          <TableBody
            sx={{
              backgroundColor: 'background.dark',
              '& .MuiTableCell-root': { padding: 1, borderBottom: 'none' }
            }}
          >
            {[...weeklyRewards, ...weeklyRewards, ...weeklyRewards, ...weeklyRewards].map((weeklyReward) => (
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

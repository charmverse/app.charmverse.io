import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { ReactNode } from 'react';

import type { WeeklyReward } from 'lib/points/getPointsWithEvents';

import { WeeklyPointsRows } from './WeeklyPointRows';

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
          <TableRow>
            <TableCell
              align='left'
              sx={{
                width: {
                  xs: 175,
                  md: 225
                }
              }}
            >
              ACTION
            </TableCell>
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
          <Typography variant='h6' textAlign='center'>
            {emptyMessage}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}

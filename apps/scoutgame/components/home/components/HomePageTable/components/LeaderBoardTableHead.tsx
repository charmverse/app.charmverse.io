'use client';

import { TableCell, TableHead, TableRow, tableCellClasses } from '@mui/material';
import { currentSeasonNumber, getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';

import { useSmScreen } from 'hooks/useMediaScreens';

export function LeaderboardTableHead() {
  const isMoreThenSmall = useSmScreen();

  if (!isMoreThenSmall) {
    return (
      <TableHead>
        <TableCell sx={{ textAlign: 'center' }} colSpan={4}>
          SEASON {currentSeasonNumber} WEEK {getCurrentSeasonWeekNumber()} DAY {(DateTime.now().weekday % 7) + 1}
        </TableCell>
      </TableHead>
    );
  }

  return (
    <TableHead>
      <TableRow
        sx={{
          [`& .${tableCellClasses.root}`]: {
            borderBottom: 'none',
            paddingLeft: '6px',
            paddingRight: '6px'
          }
        }}
      >
        <TableCell align='center'>RANK</TableCell>
        <TableCell>BUILDER</TableCell>
        <TableCell>
          SEASON {currentSeasonNumber} WEEK {getCurrentSeasonWeekNumber()} DAY {(DateTime.now().weekday % 7) + 1}
        </TableCell>
        <TableCell sx={{ maxWidth: '100px', pr: 0 }} align='center'>
          GEMS THIS WEEK
        </TableCell>
        <TableCell />
      </TableRow>
    </TableHead>
  );
}

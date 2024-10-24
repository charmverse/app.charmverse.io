'use client';

import { Paper, Table, TableCell, TableRow, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { ReactNode } from 'react';

import type { PointsReceiptReward } from 'lib/points/getPointsReceiptsRewards';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

import { PointsReceiptRewardRow } from './PointsReceiptRewardRow';

export function PointsTable({
  pointsReceiptRewards,
  title,
  emptyMessage
}: {
  pointsReceiptRewards: PointsReceiptReward[];
  title: ReactNode | string;
  emptyMessage: string;
}) {
  if (pointsReceiptRewards.length === 0) {
    return (
      <Stack gap={0.5} alignItems='center'>
        <Typography variant='h6' color='secondary'>
          {title}
        </Typography>
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
      </Stack>
    );
  }

  return (
    <Stack gap={0.5} alignItems='center'>
      <Typography variant='h6' color='secondary'>
        {title}
      </Typography>
      <Table>
        <StyledTableHead
          sx={{
            '& .MuiTableCell-root': { width: '33.33%' }
          }}
        >
          <TableRow>
            <TableCell align='left'>ACTION</TableCell>
            <TableCell align='center'>WEEK</TableCell>
            <TableCell align='right'>POINTS</TableCell>
          </TableRow>
        </StyledTableHead>
        <StyledTableBody
          sx={{
            '& .MuiTableCell-root': {
              width: '33.33%'
            }
          }}
        >
          {pointsReceiptRewards.map((pointsReceiptReward) => (
            <PointsReceiptRewardRow
              key={`${pointsReceiptReward.period}-${pointsReceiptReward.type}`}
              pointsReceiptReward={pointsReceiptReward}
            />
          ))}
        </StyledTableBody>
      </Table>
    </Stack>
  );
}

import { Stack, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { DateTime } from 'luxon';
import * as React from 'react';

import { Avatar } from '../Avatar';

import { iconMap } from './iconMap';

export function ActivityTable({
  data
}: {
  data: {
    user: { avatar: string; username: string };
    notification: { message: string; type: 'contribution' | 'grant' | 'scout' };
    date: string;
  }[];
}) {
  return (
    <TableContainer component={Paper} sx={{ py: 2 }}>
      <Table aria-label='Activity table' size='small'>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.user.username}
              sx={{
                height: '30px',
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell component='th' scope='row'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={row.user.avatar} name={row.user.username} size='small' />
                  <Typography variant='caption' noWrap maxWidth='70px'>
                    {row.user.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  {iconMap[row.notification.type]}
                  <Typography variant='caption' noWrap>
                    {row.notification.message}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='caption' noWrap>
                  {DateTime.fromISO(row.date)
                    .toRelative({
                      style: 'narrow',
                      locale: 'en',
                      round: true
                    })
                    ?.replace(' ago', '')}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

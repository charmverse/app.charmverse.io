import { Stack, TableHead, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { DateTime } from 'luxon';
import Image from 'next/image';

import { Avatar } from '../Avatar';

import { iconMap } from './iconMap';

export function ActivityTable({
  data
}: {
  data: {
    user: { avatar: string; username: string; earned?: number; bonus?: number };
    notification: { message: string; type: 'contribution' | 'grant' | 'scout'; detail: string };
    date: string;
  }[];
}) {
  return (
    <TableContainer component={Paper} sx={{ py: 2 }}>
      <Table aria-label='Activity table' size='small'>
        <TableHead sx={{ display: { xs: 'none', md: 'table-header-group' } }}>
          <TableRow
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: 'none',
                paddingLeft: 0,
                paddingRight: 0
              }
            }}
          >
            <TableCell />
            <TableCell>ACTION</TableCell>
            <TableCell>DETAIL</TableCell>
            <TableCell align='right'>EARNED</TableCell>
            <TableCell align='right'>BONUS</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.user.username}
              sx={{
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
                  <Stack sx={{ display: { xs: 'flex', md: 'none' } }}>{iconMap[row.notification.type]}</Stack>
                  <Typography variant='caption' noWrap>
                    {row.notification.message}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  {iconMap[row.notification.type]}
                  <Typography variant='caption' noWrap>
                    {row.notification.detail}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <Typography variant='caption' noWrap>
                    {row.user.earned || 0}
                  </Typography>
                  <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                </Stack>
              </TableCell>
              <TableCell align='right'>
                {row.user.bonus && (
                  <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                    <Typography variant='caption' noWrap sx={{ display: { xs: 'none', md: 'initial' } }}>
                      {row.user.bonus || 0}
                    </Typography>
                    <Image width={15} height={15} src='/images/profile/icons/optimism-icon.svg' alt='Bonus icon' />
                  </Stack>
                )}
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

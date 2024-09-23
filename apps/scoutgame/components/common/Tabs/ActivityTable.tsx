import 'server-only';

import { Stack, TableHead, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { DateTime } from 'luxon';
import Image from 'next/image';

import type { BuilderEventRow } from 'lib/builders/getAllEvents';

import { Avatar } from '../Avatar';

import { iconMap } from './iconMap';

export async function ActivityTable({ rows }: { rows: BuilderEventRow[] }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
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
          {rows.map((row) => (
            <TableRow
              key={row.username}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell component='th' scope='row'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={row.avatar} name={row.username} size='small' />
                  <Typography variant='caption' noWrap maxWidth={{ xs: '70px', md: '100%' }}>
                    {row.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Stack sx={{ display: { xs: 'flex', md: 'none' } }}>{iconMap[row.type]}</Stack>
                  <Typography variant='caption' noWrap maxWidth={{ xs: '150px', md: '100%' }}>
                    {row.message}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  {iconMap[row.type]}
                  <Typography variant='caption' noWrap>
                    {row.detail}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <Typography variant='caption' noWrap>
                    {row.gemsEarned || 0}
                  </Typography>
                  <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                </Stack>
              </TableCell>
              <TableCell align='right'>
                {row.bonus && (
                  <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                    <Typography variant='caption' noWrap sx={{ display: { xs: 'none', md: 'initial' } }}>
                      {row.bonus || 0}
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

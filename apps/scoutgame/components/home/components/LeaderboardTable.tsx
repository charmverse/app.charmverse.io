import { Box, Stack, TableHead, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { currentSeasonNumber, getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';
import Image from 'next/image';

import { Hidden } from 'components/common/Hidden';
import { ScoutButton } from 'components/common/ScoutButton/ScoutButton';
import type { LeaderBoardRow } from 'lib/builders/getLeaderboard';

import { Avatar } from '../../common/Avatar';

export function LeaderboardTable({ data }: { data: LeaderBoardRow[] }) {
  const sorted = data.sort((a, b) => b.progress - a.progress);

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Stack
        width='100%'
        flexDirection='row'
        justifyContent='center'
        sx={{
          p: 1,
          display: {
            xs: 'flex',
            md: 'none'
          }
        }}
      >
        SEASON {currentSeasonNumber} WEEK {getCurrentSeasonWeekNumber()} DAY {(DateTime.now().weekday % 7) + 1}
      </Stack>
      <Table aria-label='Leaderboard table' size='small'>
        <TableHead
          sx={{
            display: {
              xs: 'none',
              md: 'table-header-group'
            }
          }}
        >
          <TableRow
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: 'none',
                paddingLeft: 0,
                '&:first-child': {
                  paddingLeft: 1
                }
              }
            }}
          >
            <TableCell align='center'>RANK</TableCell>
            <TableCell>BUILDER</TableCell>
            <TableCell>
              SEASON {currentSeasonNumber} WEEK {getCurrentSeasonWeekNumber()} DAY {(DateTime.now().weekday % 7) + 1}
            </TableCell>
            <TableCell sx={{ maxWidth: '100px', pr: 0 }} align='right'>
              Gems this week
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row, index) => (
            <TableRow
              key={row.username}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell align='center'>
                <Typography color={index + 1 <= 3 ? 'text.secondary' : undefined}>{index + 1}</Typography>
              </TableCell>
              <TableCell component='th' sx={{ maxWidth: { xs: '150px', md: '100%' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={row.avatar} name={row.username} size='small' />
                  <Typography variant='caption' noWrap>
                    {row.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell sx={{ maxWidth: { xs: '100px', sm: '100%' } }}>
                <Box
                  sx={{
                    background:
                      'linear-gradient(90deg, #A06CD5 0%, #9C74D8 7%, #908DE1 29%, #85A5EA 50%, #79BCF3 71%, #72CBF8 84.5%, #69DDFF 100%)',
                    height: '20px',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                    width: { xs: `${row.progress || 0}px`, md: `${row.progress || 0}%` }
                  }}
                />
              </TableCell>
              <TableCell sx={{ maxWidth: '100px' }}>
                <Stack flexDirection='row' gap={0.2} alignItems='center' justifyContent='flex-end'>
                  <Typography variant='caption'>{row.gems}</Typography>
                  <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                </Stack>
              </TableCell>
              <Hidden mdDown>
                <TableCell>
                  <ScoutButton price={row.price} builderId={row.builderId} />
                </TableCell>
              </Hidden>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

import 'server-only';

import { Box, Stack, TableHead, Typography } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { getSXProps } from 'components/common/Hidden';
import { ScoutButton } from 'components/common/ScoutButton/ScoutButton';
import type { LeaderBoardRow } from 'lib/builders/getLeaderboard';

import { TableCellText } from './TableCellText';

export function LeaderboardTable({ data }: { data: LeaderBoardRow[] }) {
  const sorted = data.sort((a, b) => b.progress - a.progress);

  return (
    <Table aria-label='Leaderboard table' size='small' component={Paper} sx={{ px: { md: 6 } }}>
      <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1000, backgroundColor: 'background.paper' }}>
        <TableRow
          sx={{
            boxShadow: '2px 2px 2px 0px rgba(0, 0, 0, 0.25)',
            [`& .${tableCellClasses.root}`]: {
              borderBottom: 'none',
              paddingLeft: '6px',
              paddingRight: '6px'
            }
          }}
        >
          <TableCell align='center'>RANK</TableCell>
          <TableCell>BUILDER</TableCell>
          <TableCell>WEEK {getCurrentSeasonWeekNumber()}</TableCell>
          <TableCell
            sx={{ maxWidth: { xs: '100px', sm: '100%' }, display: { xs: 'none', sm: 'block' }, pr: 0 }}
            align='center'
          >
            GEMS
          </TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row, index) => (
          <TableRow
            key={row.id}
            sx={{
              '&:last-child td, &:last-child th': { border: 0 },
              '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
            }}
          >
            <TableCell align='center'>
              <TableCellText color={index + 1 <= 3 ? 'text.secondary' : undefined}>{index + 1}</TableCellText>
            </TableCell>
            <TableCell component='th'>
              <Stack
                href={`/u/${row.path}`}
                component={Link}
                alignItems='center'
                flexDirection='row'
                gap={1}
                maxWidth={{ xs: '120px', md: '200px' }}
              >
                <Avatar src={row.avatar} name={row.displayName} size='small' />
                <TableCellText noWrap>{row.displayName}</TableCellText>
              </Stack>
            </TableCell>
            <TableCell sx={{ width: { xs: '100%', md: '60%' } }}>
              <Box
                sx={{
                  background:
                    'linear-gradient(90deg, #A06CD5 0%, #9C74D8 7%, #908DE1 29%, #85A5EA 50%, #79BCF3 71%, #72CBF8 84.5%, #69DDFF 100%)',
                  height: '20px',
                  borderTopRightRadius: '10px',
                  borderBottomRightRadius: '10px',
                  clipPath: `inset(0 ${100 - (row.progress || 0)}% 0 0 round 0 15px 15px 0)`
                }}
              />
            </TableCell>
            <TableCell>
              <Stack flexDirection='row' gap={0.2} alignItems='center' justifyContent='center'>
                <TableCellText>{row.gemsCollected}</TableCellText>
                <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
              </Stack>
            </TableCell>
            <TableCell sx={getSXProps({ mdDown: true, display: 'table-cell' })} width='150px'>
              <ScoutButton builder={row} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

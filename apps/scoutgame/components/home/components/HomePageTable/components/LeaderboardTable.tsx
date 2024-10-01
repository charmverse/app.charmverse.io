import 'server-only';

import { Box, Stack } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { getSXProps } from 'components/common/Hidden';
import { ScoutButton } from 'components/common/ScoutButton/ScoutButton';
import type { LeaderBoardRow } from 'lib/builders/getLeaderboard';

import { TableCellText } from './TableCellText';

const LeaderboardTableHead = dynamic(() => import('./LeaderBoardTableHead').then((mod) => mod.LeaderboardTableHead), {
  ssr: false
});

export function LeaderboardTable({ data }: { data: LeaderBoardRow[] }) {
  const sorted = data.sort((a, b) => b.progress - a.progress);

  return (
    <TableContainer component={Paper} sx={{ px: { md: 6 } }}>
      <Table aria-label='Leaderboard table' size='small'>
        <LeaderboardTableHead />
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
                  href={`/u/${row.username}`}
                  component={Link}
                  alignItems='center'
                  flexDirection='row'
                  gap={1}
                  sx={{ maxWidth: { xs: '150px', md: '200px' } }}
                >
                  <Avatar src={row.avatar} name={row.username} size='small' />
                  <TableCellText noWrap>{row.username}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell width='100%'>
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
              <TableCell width='100px'>
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
    </TableContainer>
  );
}

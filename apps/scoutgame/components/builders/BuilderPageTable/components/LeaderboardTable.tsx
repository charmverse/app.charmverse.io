import 'server-only';

import { Box, Stack, TableHead } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import type { ISOWeek } from '@packages/scoutgame/dates';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { getSXProps } from '@packages/scoutgame-ui/components/common/Hidden';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { ScoutButton } from '@packages/scoutgame-ui/components/common/ScoutButton/ScoutButton';
import Link from 'next/link';

import type { LeaderBoardRow } from 'lib/builders/getLeaderboard';

import { CommonTableRow } from './CommonTableRow';
import { TableCellText } from './TableCellText';
import { WeekTableHead } from './WeekTableHead';

export function LeaderboardTable({ data, week }: { data: LeaderBoardRow[]; week: ISOWeek }) {
  const sorted = data.sort((a, b) => b.progress - a.progress);

  return (
    <Table
      aria-label='Leaderboard table'
      size='small'
      sx={{ px: { md: 6 }, backgroundColor: 'background.paper' }}
      data-test='leaderboard-table'
    >
      <TableHead
        sx={{
          position: 'sticky',
          top: {
            xs: -5,
            md: 0
          },
          zIndex: 1000,
          backgroundColor: 'background.paper'
        }}
      >
        <CommonTableRow>
          <TableCell align='center'>RANK</TableCell>
          <TableCell>BUILDER</TableCell>
          <TableCell>
            <WeekTableHead week={week} />
          </TableCell>
          <TableCell
            sx={{ maxWidth: { xs: '100px', sm: '100%' }, display: { xs: 'none', sm: 'table-cell' }, pr: 0 }}
            align='center'
          >
            GEMS
          </TableCell>
          <TableCell />
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row, index) => (
          <CommonTableRow key={row.id}>
            <TableCell align='center'>
              <TableCellText color={index + 1 <= 3 ? 'text.secondary' : undefined}>{index + 1}</TableCellText>
            </TableCell>
            <TableCell>
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
            <TableCell sx={{ width: { xs: '100%', md: '50%' } }}>
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
                <GemsIcon size={15} />
              </Stack>
            </TableCell>
            <TableCell sx={getSXProps({ mdDown: true, display: 'table-cell' })} width='200px'>
              <ScoutButton builder={row} />
            </TableCell>
          </CommonTableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import { Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { PointsIcon } from 'components/common/Icons';
import type { TopScout } from 'lib/scouts/getTopScouts';

import { TableCellText } from './TableCellText';

export function TopScoutsTable({ scouts }: { scouts: TopScout[] }) {
  return (
    <TableContainer data-test='top-scouts-table' component={Paper} sx={{ px: { md: 10 } }}>
      <Table aria-label='Top scouts table' size='small'>
        <TableHead>
          <TableRow
            sx={{
              '& .MuiTableCell-root': {
                paddingLeft: '6px',
                paddingRight: '6px',
                width: '16.67%',
                borderBottom: 'none'
              }
            }}
          >
            <TableCell align='center'>RANK</TableCell>
            <TableCell align='left'>SCOUT</TableCell>
            <TableCell align='right'>
              <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
                SEASON <PointsIcon />
              </Stack>
            </TableCell>
            <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
                ALL TIME <PointsIcon />
              </Stack>
            </TableCell>
            <TableCell align='center'>SCOUTED</TableCell>
            <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              NFTs HELD
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scouts.map((scout, index) => (
            <TableRow
              key={scout.username}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': {
                  p: '6px',
                  borderBottom: '1px solid',
                  borderBottomColor: 'background.default',
                  width: '16.67%'
                }
              }}
            >
              <TableCell align='center'>
                <TableCellText>{index + 1}</TableCellText>
              </TableCell>
              <TableCell component='th'>
                <Stack
                  component={Link}
                  href={`/u/${scout.username}?tab=scout`}
                  alignItems='center'
                  flexDirection='row'
                  gap={1}
                  maxWidth={{ xs: '100px', md: 'initial' }}
                >
                  <Avatar src={scout.avatar} name={scout.username} size='small' />
                  <TableCellText noWrap>{scout.username}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <TableCellText color='orange.main'>{scout.seasonPoints || 0}</TableCellText>
                  <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='season icon ' />
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <TableCellText color='orange.main'>{scout.allTimePoints || 0}</TableCellText>
                  <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='season icon ' />
                </Stack>
              </TableCell>
              <TableCell align='center'>
                <TableCellText color='orange.main'>{scout.buildersScouted || 0}</TableCellText>
              </TableCell>
              <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <TableCellText color='orange.main'>{scout.nftsHeld || 0}</TableCellText>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

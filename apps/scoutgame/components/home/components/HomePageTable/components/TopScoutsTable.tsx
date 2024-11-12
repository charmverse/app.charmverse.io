import { Stack, Table, TableBody, TableCell, TableHead } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Image from 'next/image';
import Link from 'next/link';

import type { TopScout } from 'lib/scouts/getTopScouts';

import { CommonTableRow } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function TopScoutsTable({ scouts }: { scouts: TopScout[] }) {
  return (
    <Table
      aria-label='Top scouts table'
      size='small'
      sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }}
      data-test='top-scouts-table'
    >
      <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1000, backgroundColor: 'background.paper' }}>
        <CommonTableRow>
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
            CARDS HELD
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {scouts.map((scout, index) => (
          <CommonTableRow key={scout.path}>
            <TableCell align='center' sx={{ width: '16.67%' }}>
              <TableCellText>{index + 1}</TableCellText>
            </TableCell>
            <TableCell sx={{ width: '16.67%' }}>
              <Stack
                component={Link}
                href={`/u/${scout.path}?tab=scout`}
                alignItems='center'
                flexDirection='row'
                gap={1}
                maxWidth={{ xs: '100px', md: 'initial' }}
              >
                <Avatar src={scout.avatar} name={scout.displayName} size='small' />
                <TableCellText noWrap>{scout.displayName}</TableCellText>
              </Stack>
            </TableCell>
            <TableCell align='right'>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='green.main'>{scout.seasonPoints || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-green-icon.svg' alt='season icon ' />
              </Stack>
            </TableCell>
            <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='green.main'>{scout.allTimePoints || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-green-icon.svg' alt='season icon ' />
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <TableCellText color='green.main'>{scout.buildersScouted || 0}</TableCellText>
            </TableCell>
            <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              <TableCellText color='green.main'>{scout.nftsHeld || 0}</TableCellText>
            </TableCell>
          </CommonTableRow>
        ))}
      </TableBody>
    </Table>
  );
}

'use client';

import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { TopScoutInfo } from 'lib/scouts/getTopScouts';

import { CommonTableRow, tableRowSx } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function TopScoutsTable({ scouts, order, sort }: { scouts: TopScoutInfo[]; order: string; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'scouts');
    params.set('sort', sortBy);
    params.set('order', order === 'desc' || sort !== sortBy ? 'asc' : 'desc');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Table
      aria-label='Top scouts table'
      size='small'
      sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }}
      data-test='top-scouts-table'
    >
      <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1000, backgroundColor: 'background.paper' }}>
        <CommonTableRow>
          <TableCell align='left' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            SCOUT
          </TableCell>
          <TableCell
            align='center'
            onClick={() => handleSort('rank')}
            sx={{
              fontSize: { xs: '12px', md: 'initial' },
              cursor: 'pointer'
            }}
          >
            RANK
          </TableCell>
          <TableCell
            align='right'
            onClick={() => handleSort('points')}
            sx={{
              fontSize: { xs: '12px', md: 'initial' },
              cursor: 'pointer'
            }}
          >
            <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
              POINTS
            </Stack>
          </TableCell>
          <TableCell
            align='center'
            onClick={() => handleSort('builders')}
            sx={{
              whiteSpace: 'nowrap',
              display: 'table-cell',
              fontSize: { xs: '12px', md: 'initial' },
              cursor: 'pointer'
            }}
          >
            BUILDERS
          </TableCell>
          <TableCell
            align='center'
            onClick={() => handleSort('cards')}
            sx={{
              whiteSpace: 'nowrap',
              display: 'table-cell',
              fontSize: { xs: '12px', md: 'initial' },
              cursor: 'pointer'
            }}
          >
            CARDS
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {scouts.map((scout) => (
          <TableRow
            key={scout.path}
            sx={tableRowSx}
            onClick={() => router.push(`/u/${scout.path}?tab=scout`)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell sx={{ width: '16.67%' }}>
              <Stack alignItems='center' flexDirection='row' gap={1} maxWidth={{ xs: '100px', md: 'initial' }}>
                <Avatar src={scout.avatar} name={scout.displayName} size='small' />
                <TableCellText noWrap>{scout.displayName}</TableCellText>
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <TableCellText>{scout.rank === 0 ? '-' : scout.rank}</TableCellText>
            </TableCell>
            <TableCell align='right' sx={{ display: 'table-cell' }}>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='green.main'>{scout.points || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-green-icon.svg' alt='scout game icon ' />
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <TableCellText color='green.main'>{scout.builders || 0}</TableCellText>
            </TableCell>
            <TableCell align='center'>
              <TableCellText color='green.main'>{scout.cards || 0}</TableCellText>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

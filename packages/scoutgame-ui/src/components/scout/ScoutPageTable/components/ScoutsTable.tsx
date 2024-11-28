'use client';

import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import type { ScoutInfo } from '@packages/scoutgame/scouts/getScouts';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Avatar } from '../../../common/Avatar';

import { CommonTableRow, tableRowSx } from './CommonTableRow';
import { TableCellText } from './TableCellText';

function SortIcon({ columnName, order, sort }: { columnName: string; order: string; sort: string }) {
  if (sort !== columnName) return null;
  return order === 'asc' ? (
    <NorthIcon color='primary' sx={{ fontSize: 14, ml: 0.15 }} />
  ) : (
    <SouthIcon color='primary' sx={{ fontSize: 14, ml: 0.15 }} />
  );
}

export function ScoutsTable({ scouts, order, sort }: { scouts: ScoutInfo[]; order: string; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'scouts');
    params.set('scoutSort', sortBy);
    params.set('scoutOrder', order === 'desc' || sort !== sortBy ? 'asc' : 'desc');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Table
      aria-label='Top scouts table'
      size='small'
      sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }}
      data-test='top-scouts-table'
    >
      <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1, backgroundColor: 'background.paper' }}>
        <CommonTableRow>
          <TableCell align='left' sx={{ fontSize: { xs: '10px', md: 'initial' }, py: 1 }}>
            SCOUT
          </TableCell>
          <TableCell
            onClick={() => handleSort('rank')}
            sx={{
              fontSize: { xs: '10px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='center'>
              RANK
              <SortIcon columnName='rank' order={order} sort={sort} />
            </Stack>
          </TableCell>
          <TableCell
            onClick={() => handleSort('points')}
            sx={{
              fontSize: { xs: '10px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='flex-end'>
              POINTS
              <SortIcon columnName='points' order={order} sort={sort} />
            </Stack>
          </TableCell>
          <TableCell
            onClick={() => handleSort('builders')}
            sx={{
              fontSize: { xs: '10px', md: 'initial' },
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='center'>
              BUILDERS
              <SortIcon columnName='builders' order={order} sort={sort} />
            </Stack>
          </TableCell>
          <TableCell
            onClick={() => handleSort('cards')}
            sx={{
              fontSize: { xs: '10px', md: 'initial' },
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='center'>
              CARDS
              <SortIcon columnName='cards' order={order} sort={sort} />
            </Stack>
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
            <TableCell>
              <Stack alignItems='center' flexDirection='row' gap={1} maxWidth={{ xs: '85px', md: 'initial' }}>
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

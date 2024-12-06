'use client';

import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import type { BuilderMetadata } from '@packages/scoutgame/builders/getBuilders';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

export function BuildersTable({ builders, order, sort }: { builders: BuilderMetadata[]; order: string; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'builders');
    params.set('builderSort', sortBy);
    params.set('builderOrder', order === 'desc' || sort !== sortBy ? 'asc' : 'desc');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Table
      aria-label='Builders table'
      size='small'
      sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }}
      data-test='builders-table'
    >
      <TableHead
        sx={{
          position: 'sticky',
          top: {
            xs: 20,
            md: 45
          },
          zIndex: 1000,
          backgroundColor: 'background.paper'
        }}
      >
        <CommonTableRow>
          <TableCell align='left' sx={{ fontSize: { xs: '10px', md: 'initial' }, py: 1 }}>
            BUILDER
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
            onClick={() => handleSort('price')}
            sx={{
              fontSize: { xs: '10px', md: 'initial' },
              cursor: 'pointer',
              py: 1
            }}
          >
            <Stack direction='row' alignItems='center' justifyContent='flex-end'>
              PRICE
              <SortIcon columnName='price' order={order} sort={sort} />
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
        {builders.map((builder) => (
          <TableRow key={builder.path} sx={tableRowSx} onClick={() => router.push(`/u/${builder.path}?tab=builder`)}>
            <TableCell>
              <Stack alignItems='center' flexDirection='row' gap={1} maxWidth={{ xs: '85px', md: 'initial' }}>
                <Avatar src={builder.avatar} name={builder.displayName} size='small' />
                <TableCellText noWrap>{builder.displayName}</TableCellText>
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <TableCellText>{builder.rank === -1 ? '-' : builder.rank}</TableCellText>
            </TableCell>
            <TableCell align='center'>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='text.secondary'>{convertCostToPoints(builder.price || BigInt(0))}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-blue-icon.svg' alt='scout game icon ' />
              </Stack>
            </TableCell>
            <TableCell align='right' sx={{ display: 'table-cell' }}>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='orange.main'>{builder.points || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='scout game icon ' />
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <TableCellText color='orange.main'>{builder.cards || 0}</TableCellText>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

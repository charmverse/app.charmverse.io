'use client';

import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import type { TopBuilderInfo } from 'lib/builders/getTopBuilders';

import { CommonTableRow, tableRowSx } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function TopBuildersTable({
  builders,
  order,
  sort
}: {
  builders: TopBuilderInfo[];
  order: string;
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (sortBy: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'builders');
    params.set('sort', sortBy);
    params.set('order', order === 'desc' || sort !== sortBy ? 'asc' : 'desc');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Table
      aria-label='Top scouts table'
      size='small'
      sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }}
      data-test='top-builders-table'
    >
      <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1000, backgroundColor: 'background.paper' }}>
        <CommonTableRow>
          <TableCell align='left' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            BUILDER
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
            align='center'
            onClick={() => handleSort('price')}
            sx={{
              fontSize: { xs: '12px', md: 'initial' },
              cursor: 'pointer'
            }}
          >
            PRICE
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
            onClick={() => handleSort('cards')}
            sx={{
              fontSize: { xs: '12px', md: 'initial' },
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            CARDS
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {builders.map((builder) => (
          <TableRow key={builder.path} sx={tableRowSx} onClick={() => router.push(`/u/${builder.path}?tab=builder`)}>
            <TableCell sx={{ width: '16.67%' }}>
              <Stack alignItems='center' flexDirection='row' gap={1} maxWidth={{ xs: '100px', md: 'initial' }}>
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

'use client';

import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { TopScoutInfo } from 'lib/scouts/getTopScouts';

import { CommonTableRow, tableRowSx } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function TopScoutsTable({ scouts, order, sort }: { scouts: TopScoutInfo[]; order: string; sort: string }) {
  const router = useRouter();
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
          <TableCell align='center' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            <Link href={`/scout?tab=scouts&order=${order === 'desc' || sort !== 'rank' ? 'asc' : 'desc'}&sort=rank`}>
              RANK
            </Link>
          </TableCell>
          <TableCell align='right' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
              <Link
                href={`/scout?tab=scouts&order=${order === 'desc' || sort !== 'points' ? 'asc' : 'desc'}&sort=points`}
              >
                POINTS
              </Link>
            </Stack>
          </TableCell>
          <TableCell
            align='center'
            sx={{ whiteSpace: 'nowrap', display: 'table-cell', fontSize: { xs: '12px', md: 'initial' } }}
          >
            <Link
              href={`/scout?tab=scouts&order=${order === 'desc' || sort !== 'builders' ? 'asc' : 'desc'}&sort=builders`}
            >
              BUILDERS
            </Link>
          </TableCell>
          <TableCell
            align='center'
            sx={{ whiteSpace: 'nowrap', display: 'table-cell', fontSize: { xs: '12px', md: 'initial' } }}
          >
            <Link href={`/scout?tab=scouts&order=${order === 'desc' || sort !== 'cards' ? 'asc' : 'desc'}&sort=cards`}>
              CARDS
            </Link>
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {scouts.map((scout) => (
          <TableRow
            key={scout.path}
            sx={tableRowSx}
            component={Link}
            href={`/u/${scout.path}?tab=scout`}
            onClick={() => router.push(`/u/${scout.path}?tab=scout`)}
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

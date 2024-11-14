import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Image from 'next/image';
import Link from 'next/link';

import type { TopBuilderInfo } from 'lib/builders/getTopBuilders';

import { CommonTableRow, tableRowSx } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function TopBuildersTable({ builders }: { builders: TopBuilderInfo[] }) {
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
          <TableCell align='center' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            RANK
          </TableCell>
          <TableCell align='center' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            PRICE
          </TableCell>
          <TableCell align='right' sx={{ fontSize: { xs: '12px', md: 'initial' } }}>
            <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
              POINTS
            </Stack>
          </TableCell>
          <TableCell
            align='center'
            sx={{ whiteSpace: 'nowrap', display: 'table-cell', fontSize: { xs: '12px', md: 'initial' } }}
          >
            CARDS
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {builders.map((builder) => (
          <TableRow key={builder.path} sx={tableRowSx} component={Link} href={`/u/${builder.path}?tab=builder`}>
            <TableCell sx={{ width: '16.67%' }}>
              <Stack alignItems='center' flexDirection='row' gap={1} maxWidth={{ xs: '100px', md: 'initial' }}>
                <Avatar src={builder.avatar} name={builder.displayName} size='small' />
                <TableCellText noWrap>{builder.displayName}</TableCellText>
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <TableCellText>{builder.rank}</TableCellText>
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

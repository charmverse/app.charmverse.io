import { Stack, Table, TableBody, TableCell, TableHead } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { ScoutButton } from '@packages/scoutgame-ui/components/common/ScoutButton/ScoutButton';
import Image from 'next/image';
import Link from 'next/link';

import type { TopBuilderInfo } from 'lib/builders/getTopBuilders';

import { CommonTableRow } from './CommonTableRow';
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
          <TableCell align='center'>RANK</TableCell>
          <TableCell align='left'>BUILDER</TableCell>
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
          <TableCell align='center' sx={{ whiteSpace: 'nowrap', display: 'table-cell' }}>
            SCOUTED BY
          </TableCell>
          <TableCell align='center'>PRICE</TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {builders.map((builder, index) => (
          <CommonTableRow key={builder.path}>
            <TableCell align='center' sx={{ width: '16.67%' }}>
              <TableCellText>{index + 1}</TableCellText>
            </TableCell>
            <TableCell sx={{ width: '16.67%' }}>
              <Stack
                component={Link}
                href={`/u/${builder.path}`}
                alignItems='center'
                flexDirection='row'
                gap={1}
                maxWidth={{ xs: '100px', md: 'initial' }}
              >
                <Avatar src={builder.avatar} name={builder.displayName} size='small' />
                <TableCellText noWrap>{builder.displayName}</TableCellText>
              </Stack>
            </TableCell>
            <TableCell align='right' sx={{ display: 'table-cell' }}>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='orange.main'>{builder.seasonPoints || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='scout game icon ' />
              </Stack>
            </TableCell>
            <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                <TableCellText color='orange.main'>{builder.allTimePoints || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='scout game icon ' />
              </Stack>
            </TableCell>
            <TableCell align='center'>
              <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='center'>
                <TableCellText color='orange.main'>{builder.scoutedBy || 0}</TableCellText>
                <Image width={15} height={15} src='/images/profile/icons/like-orange-icon.svg' alt='like icon ' />
              </Stack>
            </TableCell>
            <TableCell align='center' width='initial'>
              <ScoutButton builder={builder} />
            </TableCell>
          </CommonTableRow>
        ))}
      </TableBody>
    </Table>
  );
}

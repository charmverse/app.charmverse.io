import { Stack, Table, TableBody, TableCell, TableHead } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { GemsIcon } from 'components/common/Icons';
import type { NewScout } from 'lib/scouts/getNewScouts';

import { CommonTableRow } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function NewScoutsTable({ scouts }: { scouts: NewScout[] }) {
  return (
    <Table size='small' sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }} data-test='new-scouts-table'>
      <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1000, backgroundColor: 'background.paper' }}>
        <CommonTableRow>
          <TableCell align='center' sx={{ width: '20%' }}>
            RANK
          </TableCell>
          <TableCell align='left' sx={{ width: '20%' }}>
            SCOUT
          </TableCell>
          <TableCell align='right' sx={{ width: '20%' }}>
            <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
              BUILDER GEMS <GemsIcon />
            </Stack>
          </TableCell>
          <TableCell align='center' sx={{ width: '20%' }}>
            SCOUTED
          </TableCell>
          <TableCell align='center' sx={{ width: '20%', display: { xs: 'none', md: 'table-cell' } }}>
            CARDS HELD
          </TableCell>
        </CommonTableRow>
      </TableHead>
      <TableBody>
        {scouts.map((scout, index) => (
          <CommonTableRow key={scout.path}>
            <TableCell align='center'>
              <TableCellText>{index + 1}</TableCellText>
            </TableCell>
            <TableCell>
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
                <TableCellText>{scout.builderGemsCollected || 0}</TableCellText>
                <GemsIcon />
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

import { Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { PointsIcon } from 'components/common/Icons';
import { ScoutButton } from 'components/common/ScoutButton/ScoutButton';
import type { TopBuilderInfo } from 'lib/builders/getTopBuilders';

import { TableCellText } from './TableCellText';

export function TopBuildersTable({ builders }: { builders: TopBuilderInfo[] }) {
  return (
    <TableContainer data-test='top-builders-table' component={Paper} sx={{ px: { md: 10 } }}>
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
          </TableRow>
        </TableHead>
        <TableBody>
          {builders.map((builder, index) => (
            <TableRow
              key={builder.path}
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
                  href={`/u/${builder.path}`}
                  alignItems='center'
                  flexDirection='row'
                  gap={1}
                  maxWidth={{ xs: '120px', md: 'initial' }}
                >
                  <Avatar src={builder.avatar} name={builder.displayName} size='small' />
                  <TableCellText noWrap>{builder.displayName}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: 'table-cell' }}>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <TableCellText color='green.main'>{builder.seasonPoints || 0}</TableCellText>
                  <Image
                    width={15}
                    height={15}
                    src='/images/profile/scout-game-green-icon.svg'
                    alt='scout game icon '
                  />
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <TableCellText color='green.main'>{builder.allTimePoints || 0}</TableCellText>
                  <Image
                    width={15}
                    height={15}
                    src='/images/profile/scout-game-green-icon.svg'
                    alt='scout game icon '
                  />
                </Stack>
              </TableCell>
              <TableCell align='center'>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='center'>
                  <TableCellText color='green.main'>{builder.scoutedBy || 0}</TableCellText>
                  <Image width={15} height={15} src='/images/profile/icons/like-green-icon.svg' alt='like icon ' />
                </Stack>
              </TableCell>
              <TableCell align='center' width='150px'>
                <ScoutButton builder={builder} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

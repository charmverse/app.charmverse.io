import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  tableCellClasses
} from '@mui/material';
import Image from 'next/image';

import type { TopScout } from 'lib/scouts/getTopScouts';

import { Avatar } from '../../common/Avatar';

export function TopScoutsTable({ scouts }: { scouts: TopScout[] }) {
  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table aria-label='Top scouts table' size='small'>
        <TableHead>
          <TableRow
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: 'none',
                paddingLeft: 0,
                '&:first-child': {
                  paddingLeft: 1
                }
              }
            }}
          >
            <TableCell align='center'>RANK</TableCell>
            <TableCell align='left'>SCOUT</TableCell>
            <TableCell align='right'>SEASON</TableCell>
            <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              ALL TIME
            </TableCell>
            <TableCell align='center'>SCOUTED</TableCell>
            <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              NFT's HELD
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scouts.map((scout, index) => (
            <TableRow
              key={scout.username}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell align='center'>
                <Typography>{index + 1}</Typography>
              </TableCell>
              <TableCell component='th'>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={scout.avatar} name={scout.username} size='small' />
                  <Typography variant='caption' noWrap maxWidth={{ xs: '100px', md: '100%' }}>
                    {scout.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <Typography variant='caption' color='orange.main' noWrap>
                    {scout.seasonPoints || 0}
                  </Typography>
                  <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='season icon ' />
                </Stack>
              </TableCell>
              <TableCell align='right' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <Typography variant='caption' color='orange.main' noWrap>
                    {scout.allTimePoints || 0}
                  </Typography>
                  <Image width={15} height={15} src='/images/profile/scout-game-orange-icon.svg' alt='season icon ' />
                </Stack>
              </TableCell>
              <TableCell align='center'>
                <Typography variant='caption' color='orange.main' noWrap>
                  {scout.buildersScouted || 0}
                </Typography>
              </TableCell>
              <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Typography variant='caption' color='orange.main' noWrap>
                  {scout.nftsHeld || 0}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

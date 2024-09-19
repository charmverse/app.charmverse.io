import {
  Button,
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
import Link from 'next/link';

import { Avatar } from '../Avatar';

export function TopBuildersTable({
  data
}: {
  data: {
    user: { avatar: string; username: string };
    season: number;
    allTime: number;
    scoutedBy: number;
    price: number;
  }[];
}) {
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
            <TableCell align='center' sx={{ whiteSpace: 'nowrap' }}>
              SCOUTED BY
            </TableCell>
            <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              PRICE
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={row.user.username}
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
                  <Avatar src={row.user.avatar} name={row.user.username} size='small' />
                  <Typography variant='caption' noWrap maxWidth={{ xs: '100px', md: '100%' }}>
                    {row.user.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <Typography variant='caption' color='green.main' noWrap>
                    {row.season || 0}
                  </Typography>
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
                  <Typography variant='caption' color='green.main' noWrap>
                    {row.allTime || 0}
                  </Typography>
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
                  <Typography variant='caption' color='green.main' noWrap>
                    {row.scoutedBy || 0}
                  </Typography>
                  <Image width={15} height={15} src='/images/profile/icons/like-green-icon.svg' alt='like icon ' />
                </Stack>
              </TableCell>
              <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Button fullWidth variant='buy' LinkComponent={Link} href={`/u/${row.user.username}/checkout`}>
                  ${row.price || 0}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

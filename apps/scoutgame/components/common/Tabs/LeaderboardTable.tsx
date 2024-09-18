'use client';

import type { Theme } from '@mui/material';
import { Box, Button, Stack, TableHead, Typography, useMediaQuery } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from '../Avatar';

export function LeaderboardTable({
  data
}: {
  data: {
    user: { avatar: string; username: string };
    progress: number;
    gems: number;
    price: number;
  }[];
}) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const sorted = data.sort((a, b) => b.progress - a.progress);

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table aria-label='Leaderboard table' size='small'>
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
            {isMobile ? (
              <TableCell colSpan={4} sx={{ textAlign: 'center' }}>
                SEASON 1 WEEK 1 DAY 1
              </TableCell>
            ) : (
              <>
                <TableCell align='center'>RANK</TableCell>
                <TableCell>BUILDER</TableCell>
                <TableCell>SEASON 1 WEEK 1 DAY 1</TableCell>
                <TableCell sx={{ maxWidth: '100px', pr: 0 }} align='right'>
                  Gems this week
                </TableCell>
                <TableCell />
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row, index) => (
            <TableRow
              key={row.user.username}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell align='center'>
                <Typography color={index + 1 <= 3 ? 'text.secondary' : undefined}>{index + 1}</Typography>
              </TableCell>
              <TableCell component='th' sx={{ maxWidth: { xs: '150px', md: '100%' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={row.user.avatar} name={row.user.username} size='small' />
                  <Typography variant='caption' noWrap>
                    {row.user.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell sx={{ maxWidth: { xs: '100px', sm: '100%' } }}>
                <Box
                  sx={{
                    background:
                      'linear-gradient(90deg, #A06CD5 0%, #9C74D8 7%, #908DE1 29%, #85A5EA 50%, #79BCF3 71%, #72CBF8 84.5%, #69DDFF 100%)',
                    height: '20px',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                    width: { xs: `${row.progress || 0}px`, md: `${row.progress || 0}%` }
                  }}
                />
              </TableCell>
              <TableCell sx={{ maxWidth: '100px' }}>
                <Stack flexDirection='row' gap={0.2} alignItems='center' justifyContent='flex-end'>
                  <Typography variant='caption'>{row.gems}</Typography>
                  <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                </Stack>
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <Button fullWidth variant='buy' LinkComponent={Link} href={`/u/${row.user.username}/checkout`}>
                    ${row.price || 0}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

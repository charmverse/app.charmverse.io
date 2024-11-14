import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import type { SessionUser } from 'lib/session/interfaces';

import { Avatar } from '../../common/Avatar';

export function MyFriends({ friends }: { friends: SessionUser[] }) {
  const sorted = friends.sort((a, b) => b.currentBalance - a.currentBalance);

  if (friends.length === 0) {
    return <Typography>No friends joined through your referral link</Typography>;
  }

  return (
    <Stack gap={2}>
      <Typography variant='h5' textAlign='center'>
        My Friends
      </Typography>
      <Table
        aria-label='Leaderboard table'
        size='small'
        sx={{ px: { md: 6 }, backgroundColor: 'background.paper' }}
        data-test='friends-table'
      >
        <TableHead>
          <TableRow>
            <TableCell align='left'>FRIEND</TableCell>
            <TableCell align='center'>STATUS</TableCell>
            <TableCell align='right'>POINTS</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell align='center'>
                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Avatar src={row.avatar} name={row.displayName} size='small' />
                  <Typography noWrap>{row.displayName}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography textAlign='center' color='secondary'>
                  Recruited
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Stack gap={0.5} flexDirection='row' alignItems='center' justifyContent='right'>
                  <Typography noWrap color='secondary'>
                    {row.currentBalance}
                  </Typography>
                  <img width={20} height={20} src='/images/profile/icons/scout-game-blue-icon.svg' alt='points' />
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}

import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { Avatar } from '../../common/Avatar';

export function MyFriends({ friends }: { friends: SessionUser[] }) {
  const sorted = friends.sort((a, b) => b.currentBalance - a.currentBalance);

  if (friends.length === 0) {
    return (
      <Paper
        sx={{
          bgcolor: {
            xs: 'transparent',
            md: 'background.dark'
          },
          flex: 1,
          gap: 2,
          p: {
            xs: 0,
            md: 2
          }
        }}
      >
        <Typography variant='h5' textAlign='center'>
          My Friends
        </Typography>
        <Typography textAlign='center'>No friends joined through your referral link</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        bgcolor: {
          xs: 'transparent',
          md: 'background.dark'
        },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 2,
        p: {
          xs: 0,
          md: 2
        }
      }}
    >
      <Typography variant='h5' textAlign='center'>
        My Friends
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label='Leaderboard table' size='small' sx={{ px: { md: 6 } }} data-test='friends-table'>
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
      </TableContainer>
    </Paper>
  );
}

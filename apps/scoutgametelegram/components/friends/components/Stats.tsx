import { Box, Stack, Typography } from '@mui/material';
import { rewardPoints } from '@packages/scoutgame/constants';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

export function Stats({ friends }: { friends: SessionUser[] }) {
  const friendsJoined = friends.length;
  const pointsEarned = friends.length * rewardPoints;

  return (
    <Stack flexDirection='row' justifyContent='space-between' px={4}>
      <Box>
        <Typography textAlign='center' variant='body2' mb={1} fontWeight={600}>
          FRIENDS JOINED
        </Typography>
        <Box p={2} gap={1} bgcolor='primary.dark'>
          <Typography variant='h5' component='p' fontWeight={600} textAlign='center' color='secondary'>
            {friendsJoined}
          </Typography>
        </Box>
      </Box>
      <Box>
        <Typography textAlign='center' variant='body2' mb={1} fontWeight={600}>
          POINTS EARNED
        </Typography>
        <Stack p={2} gap={0.5} bgcolor='primary.dark' flexDirection='row' justifyContent='center'>
          <Typography variant='h5' component='p' fontWeight={600} textAlign='center' color='secondary'>
            {pointsEarned}
          </Typography>
          <img src='/images/profile/icons/scout-game-blue-icon.svg' alt='points' />
        </Stack>
      </Box>
    </Stack>
  );
}

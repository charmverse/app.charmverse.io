import { Box, Stack, Typography } from '@mui/material';
import { rewardPoints } from '@packages/scoutgame/constants';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

export function Stats({ friends }: { friends: SessionUser[] }) {
  const friendsJoined = friends.length;
  const pointsEarned = friends.length * rewardPoints;

  return (
    <Stack flexDirection={{ xs: 'column', md: 'row' }} justifyContent='space-between' gap={{ xs: 0.5, md: 4 }}>
      <Box>
        <Typography textAlign='center' variant='caption' mb={1} fontWeight={600}>
          FRIENDS JOINED
        </Typography>
        <Stack px={2} py={0.5} gap={1} bgcolor='primary.dark' borderRadius='30px'>
          <Typography variant='h5' component='p' fontWeight={600} textAlign='center' color='secondary'>
            {friendsJoined}
          </Typography>
        </Stack>
      </Box>
      <Box>
        <Typography textAlign='center' variant='caption' mb={1} fontWeight={600}>
          POINTS EARNED
        </Typography>
        <Stack
          px={2}
          py={0.5}
          gap={0.5}
          bgcolor='primary.dark'
          flexDirection='row'
          justifyContent='center'
          borderRadius='30px'
        >
          <Typography variant='h5' component='p' fontWeight={600} textAlign='center' color='secondary'>
            {pointsEarned}
          </Typography>
          <img src='/images/profile/icons/scout-game-blue-icon.svg' alt='points' />
        </Stack>
      </Box>
    </Stack>
  );
}

import { Stack, Typography } from '@mui/material';

import { DailyClaimGift } from '../../claim/components/common/DailyClaimGift';

export function Info() {
  return (
    <Stack borderRadius={1} alignItems='center' flexDirection='row' p={2} gap={1} bgcolor='primary.dark'>
      <DailyClaimGift size={50} />
      <Typography fontWeight={600}>
        Invite friends to play and earn +5 <img src='/images/profile/scout-game-icon.svg' alt='points' /> per referral
        for you and your friends!
      </Typography>
    </Stack>
  );
}

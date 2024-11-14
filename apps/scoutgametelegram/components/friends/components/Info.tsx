import { Stack, Typography } from '@mui/material';

import { DailyClaimGift } from 'components/quests/components/DailyClaimGallery/DailyClaimGift';

export function Info() {
  return (
    <Stack justifyContent='center' alignItems='center' gap={1} my={2}>
      <Typography variant='h4' color='secondary' fontWeight={600}>
        Daily Claim
      </Typography>
      <Stack
        // paddingBottom=0.25
        borderRadius={1}
        alignItems='center'
        flexDirection='row'
        p={2}
        gap={1}
        bgcolor='primary.dark'
      >
        <DailyClaimGift size={50} />
        <Typography fontWeight={600} fontSize='1.1rem'>
          Invite friends to play and earn +5 <img src='/images/profile/icons/scout-game-icon.svg' alt='points' /> per
          referral for you and your friends!
        </Typography>
      </Stack>
    </Stack>
  );
}

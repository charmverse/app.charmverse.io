import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import Image from 'next/image';

import type { DailyClaim } from 'lib/users/getDailyClaims';

import { DailyClaimGift } from './DailyClaimGift';

export function DailyClaimCard({ dailyClaim }: { dailyClaim: DailyClaim }) {
  const todayDate = DateTime.now().startOf('day');
  const claimDateDay = DateTime.fromJSDate(dailyClaim.date.toJSDate(), { zone: 'utc' }).startOf('day');
  const isClaimToday = claimDateDay.equals(todayDate);
  const isPastDate = todayDate > claimDateDay;
  const buttonLabel = isClaimToday ? 'Claim' : dailyClaim.isBonus ? 'Bonus' : `Day ${dailyClaim.day}`;
  const isClaimed = dailyClaim.claimed;

  return (
    <Stack
      sx={{
        backgroundColor: isClaimed
          ? 'background.paper'
          : isPastDate
            ? 'background.dark'
            : isClaimToday
              ? 'secondary.main'
              : 'primary.dark',
        height: 100,
        paddingBottom: 0.25,
        borderRadius: 1,
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <Stack flex={1} position='relative' alignItems='center' justifyContent='center' width='100%'>
        {!isClaimed ? (
          <Stack sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            {dailyClaim.isBonus ? (
              <Stack direction='row' gap={0.5} alignItems='flex-end'>
                <DailyClaimGift variant={isPastDate ? 'disabled' : isClaimToday ? 'secondary' : 'primary'} size={44} />
                <DailyClaimGift variant={isPastDate ? 'disabled' : isClaimToday ? 'secondary' : 'primary'} size={70} />
                <DailyClaimGift variant={isPastDate ? 'disabled' : isClaimToday ? 'secondary' : 'primary'} size={44} />
              </Stack>
            ) : (
              <DailyClaimGift variant={isPastDate ? 'disabled' : isClaimToday ? 'secondary' : 'primary'} size={68} />
            )}
          </Stack>
        ) : (
          <CheckCircleIcon
            fontSize='small'
            color='secondary'
            sx={{
              position: 'absolute',
              top: 5,
              right: 5
            }}
          />
        )}
        <Stack direction='row' gap={0.5} alignItems='center' zIndex={1} top={7.5} position='relative'>
          <Typography fontWeight={600}>{dailyClaim.isBonus ? '+3' : '+1'}</Typography>
          <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={18} height={10} />
        </Stack>
      </Stack>
      <Typography variant='body2' color={isClaimToday ? 'secondary.dark' : 'initial'} fontWeight={600}>
        {buttonLabel}
      </Typography>
    </Stack>
  );
}

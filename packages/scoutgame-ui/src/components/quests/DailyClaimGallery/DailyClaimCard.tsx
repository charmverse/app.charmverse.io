'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import { claimDailyRewardAction } from '@packages/scoutgame/claims/claimDailyRewardAction';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { DailyClaimGift } from '@packages/scoutgame-ui/components/claim/components/common/DailyClaimGift';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DailyClaimCard({
  dailyClaim,
  hasClaimedStreak
}: {
  dailyClaim: DailyClaim;
  hasClaimedStreak: boolean;
}) {
  const { refreshUser } = useUser();
  const { execute: claimDailyReward, isExecuting } = useAction(claimDailyRewardAction, {
    onSuccess: () => {
      refreshUser();
    }
  });
  const currentWeekDay = DateTime.fromJSDate(new Date()).weekday;
  const isPastDay = currentWeekDay > dailyClaim.day;
  const isClaimToday = currentWeekDay === dailyClaim.day;
  const isClaimed = dailyClaim.claimed;
  const buttonLabel =
    isClaimToday && !isClaimed ? 'Claim' : dailyClaim.isBonus ? 'Bonus' : WEEKDAYS[dailyClaim.day - 1];
  const canClaim = isClaimToday && !isClaimed && !isExecuting && (!dailyClaim.isBonus || hasClaimedStreak);
  const variant = isPastDay ? 'disabled' : isClaimToday ? 'secondary' : 'primary';

  return (
    <Stack
      sx={{
        backgroundColor: isClaimed
          ? 'background.light'
          : isPastDay
            ? 'background.dark'
            : isClaimToday
              ? 'secondary.main'
              : 'primary.dark',
        height: 90,
        paddingBottom: 0.25,
        borderRadius: 1,
        alignItems: 'center',
        position: 'relative',
        cursor: canClaim ? 'pointer' : 'default'
      }}
      data-test={`daily-claim-${canClaim ? 'enabled' : 'disabled'}`}
      onClick={() => {
        if (canClaim) {
          claimDailyReward({ isBonus: dailyClaim.isBonus, dayOfWeek: currentWeekDay });
        }
      }}
    >
      <Stack flex={1} position='relative' alignItems='center' justifyContent='center' width='100%'>
        {!isClaimed ? (
          <Stack sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            {dailyClaim.isBonus ? (
              <Stack direction='row' gap={0.5} alignItems='flex-end'>
                <DailyClaimGift variant={variant} size={44} />
                <DailyClaimGift variant={variant} size={70} />
                <DailyClaimGift variant={variant} size={44} />
              </Stack>
            ) : (
              <DailyClaimGift variant={variant} size={64} />
            )}
          </Stack>
        ) : (
          <CheckCircleIcon
            fontSize='small'
            color='secondary'
            data-test='claimed-icon'
            sx={{
              position: 'absolute',
              top: 5,
              right: 5
            }}
          />
        )}
        <Stack direction='row' gap={0.5} alignItems='center' zIndex={1} top={7.5} position='relative'>
          <Typography fontWeight={600}>{dailyClaim.isBonus ? '+3' : '+1'}</Typography>
          <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={15} height={8.5} />
        </Stack>
      </Stack>
      <Typography
        variant='body2'
        color={isClaimToday && !isClaimed ? 'secondary.dark' : 'text.primary'}
        fontWeight={600}
      >
        {buttonLabel}
      </Typography>
    </Stack>
  );
}

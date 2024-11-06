'use client';

import { Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import { timeUntilFuture } from 'lib/utils/time';

export function NextClaimCountdown() {
  const currentDate = DateTime.now().toFormat('dd-MM-yyyy');
  const nextDay = DateTime.fromFormat(currentDate, 'dd-MM-yyyy').plus({ days: 1 });
  const [timeStr, setTimeStr] = useState(timeUntilFuture(nextDay.toMillis()));

  const nextDayMillis = nextDay.toMillis();

  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(timeUntilFuture(nextDayMillis));
    }, 1000);

    return () => clearInterval(timeout);
  }, [setTimeStr, nextDayMillis]);

  if (!timeStr) {
    return null;
  }

  return (
    <Stack flexDirection='row' alignItems='center' gap={1} zIndex={1} bgcolor='#000'>
      <Typography color='secondary' fontWeight={600}>
        NEXT REWARD:
      </Typography>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography variant='h5' fontWeight={600}>
          {timeStr.hours}
        </Typography>
        <Typography fontWeight={600}>h</Typography>
        <Typography variant='h5' fontWeight={600}>
          {timeStr.minutes}
        </Typography>
        <Typography fontWeight={600}>m</Typography>
      </Stack>
    </Stack>
  );
}

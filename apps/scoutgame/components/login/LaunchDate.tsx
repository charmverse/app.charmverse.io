'use client';

import { Box, Stack, Typography } from '@mui/material';
import { tierDistributionMap } from '@packages/scoutgame/waitlist/scoring/constants';
import { timeUntilFuture } from '@packages/utils/time';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { launchDates } from 'lib/session/authorizeUserByLaunchDate';

export function LaunchDate() {
  const closestFutureLaunchDate = getClosestFutureLaunchDate();
  const tier = closestFutureLaunchDate ? launchDates[closestFutureLaunchDate.dateString] : null;
  const imageUrl = tier && tierDistributionMap[tier]?.imageText;
  const [timeUntilLaunch, setTimeStr] = useState(timeUntilFuture(closestFutureLaunchDate?.timestamp));

  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(timeUntilFuture(closestFutureLaunchDate?.timestamp));
    }, 1000);

    return () => clearInterval(timeout);
  }, [setTimeStr, closestFutureLaunchDate?.timestamp]);

  if (!timeUntilLaunch) {
    return null;
  }

  return (
    <Box>
      <Stack flexDirection={{ xs: 'column', sm: 'row' }} gap={1} alignItems='center'>
        <Image
          src={imageUrl ?? ''}
          width={120}
          height={40}
          sizes='100vw'
          style={{
            width: 'auto',
            maxHeight: '40px'
          }}
          alt={`Current tier is ${tier}`}
        />
        <Typography variant='h6' suppressHydrationWarning sx={{ width: '200px' }}>
          {timeUntilLaunch?.days} days {timeUntilLaunch?.timeString}
        </Typography>
      </Stack>
    </Box>
  );
}

function getClosestFutureLaunchDate() {
  const dates = Object.keys(launchDates);
  const now = new Date().getTime();
  const futureDates = dates
    .map((date) => ({ dateString: date, timestamp: new Date(date).getTime() }))
    .filter((date) => date.timestamp > now);

  if (futureDates.length === 0) {
    return null; // No future dates available
  }

  const closestDate = futureDates.reduce((closest, dateObj) =>
    dateObj.timestamp < closest.timestamp ? dateObj : closest
  );

  return closestDate;
}

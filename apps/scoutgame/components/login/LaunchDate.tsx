import { Box, Stack, Typography } from '@mui/material';
import { tierDistributionMap } from '@packages/scoutgame/waitlist/scoring/constants';
import Image from 'next/image';

import { launchDates } from 'lib/session/authorizeUserByLaunchDate';

export function LaunchDate() {
  const closestFutureLaunchDate = getClosestFutureLaunchDate(Object.keys(launchDates));
  const timeUntilLaunch = timeUntilFuture(closestFutureLaunchDate?.timestamp);

  const tier = closestFutureLaunchDate ? launchDates[closestFutureLaunchDate.dateString] : 'common';
  const imageUrl = tierDistributionMap[tier]?.imageText;

  if (!timeUntilLaunch) {
    return null;
  }

  return (
    <Box>
      <Stack flexDirection='row' gap={3} alignItems='center'>
        <Image
          src={imageUrl}
          width={120}
          height={40}
          sizes='100vw'
          style={{
            width: 'auto',
            maxHeight: '40px'
          }}
          alt={`Current tier is ${tier}`}
        />
        <Typography variant='h6'>
          {timeUntilLaunch?.days} days {timeUntilLaunch?.timeString}
        </Typography>
      </Stack>
    </Box>
  );
}

function getClosestFutureLaunchDate(dates: string[]) {
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

function timeUntilFuture(date?: number) {
  if (!date) {
    return null; // No future dates available
  }

  const now = new Date().getTime();
  const timeDifference = date - now;

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`;

  return { days, timeString };
}

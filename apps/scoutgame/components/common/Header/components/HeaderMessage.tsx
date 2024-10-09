'use client';

import { Box, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber, getWeekStartEnd } from '@packages/scoutgame/dates';
import { useEffect, useState } from 'react';

export function HeaderMessage() {
  const [timeLeftStr, setTimeStr] = useState(getTimeLeftStr());

  useEffect(() => {
    const timeout = setInterval(() => {
      setTimeStr(getTimeLeftStr());
    }, 1000);

    return () => clearInterval(timeout);
  }, []);

  return (
    <Box width='100%' bgcolor='rgba(160, 108, 213, 0.4)' p={1}>
      <Typography variant='body1' fontWeight='500' textAlign='center'>
        Week {getCurrentSeasonWeekNumber()} ends in {timeLeftStr}
      </Typography>
    </Box>
  );
}

function getTimeLeftStr() {
  const now = new Date();
  const timeLeft = getWeekStartEnd(new Date()).end.toJSDate().getTime() - now.getTime();

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return `${days} d ${hours} h ${minutes}m`;
}

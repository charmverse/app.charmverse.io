import { Stack, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import { baseUrl } from '@root/config/constants';
import React from 'react';

export function PointsClaimBuilderScreen({
  claimedPoints,
  displayName,
  repos
}: {
  displayName: string;
  claimedPoints: number;
  repos: string[];
}) {
  const currentWeek = getCurrentSeasonWeekNumber();
  return (
    <Stack
      sx={{
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '75%',
        height: '75%',
        alignItems: 'center',
        zIndex: 1,
        mt: 4
      }}
      className='scoutgame-claim-screen'
    >
      <Typography variant='h4' fontFamily='K2D'>
        TOP BUILDER
      </Typography>
      <Typography variant='h6' color='secondary' fontWeight={600} mt={2}>
        {displayName}
      </Typography>
      <Typography variant='h6' textAlign='center'>
        scored {claimedPoints} Scout Points <br /> in week {currentWeek} of
      </Typography>
      <Typography fontWeight='bold' variant='h6' textAlign='center' fontFamily='K2D'>
        SCOUT GAME!
      </Typography>
      <img src={`${baseUrl}/images/diamond.png`} alt='Diamond' width={100} height={100} />
      <Stack gap={0.5} width='100%' px={2} mt={1}>
        <Typography variant='h6' fontWeight={700}>
          Contributions:
        </Typography>
        {repos.map((repo) => (
          <Typography key={repo} textOverflow='ellipsis'>
            {repo}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}

'use client';

import { Avatar, Stack, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import Image from 'next/image';
import React from 'react';

export function PointsClaimScoutScreen({
  claimedPoints,
  displayName,
  builders
}: {
  displayName: string;
  claimedPoints: number;
  builders: { avatar: string | null; displayName: string }[];
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
        TOP SCOUT
      </Typography>
      <Typography variant='h6' color='secondary' fontWeight={600} mt={2}>
        {displayName}
      </Typography>
      <Typography variant='h6' textAlign='center'>
        scored {claimedPoints} Scout Points <br /> in week {currentWeek} of
      </Typography>
      <Typography fontWeight='bold' variant='h6' textAlign='center' fontFamily='Posterama'>
        SCOUT GAME!
      </Typography>
      <Stack flexDirection='row' gap={1} justifyContent='space-between' width='100%' mt={2} pl={4}>
        <Stack mt={4} gap={1}>
          <Typography variant='h6' fontWeight={700}>
            My Top Builders:
          </Typography>
          {builders.map((builder) => (
            <Stack key={builder.displayName} flexDirection='row' alignItems='center' gap={1}>
              <Avatar
                src={builder.avatar ?? ''}
                alt={builder.displayName}
                variant='circular'
                sx={{ width: 24, height: 24 }}
              />
              <Typography fontWeight={600}>{builder.displayName}</Typography>
            </Stack>
          ))}
        </Stack>
        <Image src='/images/profile/builder-dog.png' alt='Builder Dog' width={200} height={200} />
      </Stack>
    </Stack>
  );
}

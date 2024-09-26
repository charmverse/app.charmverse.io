'use client';

import { Paper, Stack, Tab, Tabs, Typography, tabClasses, tabsClasses } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { useMdScreen } from 'hooks/useMediaScreens';

import type { UserProfileWithPoints } from '../ProfilePage';

export function ProfileStats({
  seasonPoints,
  allTimePoints,
  points
}: {
  seasonPoints: UserProfileWithPoints['seasonPoints'];
  allTimePoints: UserProfileWithPoints['allTimePoints'];
  points?: number;
}) {
  const [selectedDuration, setSelectedDuration] = useState<'season' | 'allTime'>('season');
  const isDesktop = useMdScreen();

  return (
    <Paper
      sx={{
        px: 4,
        py: 1.5,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Stack gap={0.5}>
        <Typography variant='subtitle2' textAlign='center' color='secondary'>
          BALANCE
        </Typography>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography variant={isDesktop ? 'h3' : 'h4'} fontWeight={400}>
            {points || 0}
          </Typography>
          <Image src='/images/profile/scout-game-icon.svg' width='40' height='40' alt='scout game icon' />
        </Stack>
      </Stack>
      <Stack gap={2}>
        <Tabs
          value={selectedDuration}
          aria-label='profile page points duration tabs'
          role='navigation'
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            [`& .${tabsClasses.flexContainer}`]: {
              justifyContent: { md: 'center' }
            },
            [`& .${tabsClasses.indicator}`]: {
              bottom: 3
            },
            [`& .${tabClasses.root}`]: {
              borderBottom: '1px solid',
              borderColor: 'text.primary'
            }
          }}
        >
          <Tab label='Season' onClick={() => setSelectedDuration('season')} value='season' />
          <Tab label='All Time' onClick={() => setSelectedDuration('allTime')} value='allTime' />
        </Tabs>
        <Stack flexDirection='row' gap={2} justifyContent='space-between' px={1}>
          <Stack alignItems='center' gap={0.5}>
            <Typography color='green.main' variant='subtitle2' fontWeight={500}>
              BUILDING
            </Typography>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Typography variant='h4' color='green.main' fontWeight={400}>
                {selectedDuration === 'season'
                  ? seasonPoints?.pointsEarnedAsBuilder || 0
                  : allTimePoints?.pointsEarnedAsBuilder || 0}
              </Typography>
              <Image src='/images/profile/scout-game-green-icon.svg' width='25' height='25' alt='build icon' />
            </Stack>
          </Stack>
          <Stack alignItems='center' gap={0.5}>
            <Typography color='orange.main' variant='subtitle2' fontWeight={500}>
              SCOUTING
            </Typography>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Typography variant='h4' color='orange.main' fontWeight={400}>
                {selectedDuration === 'season'
                  ? seasonPoints?.pointsEarnedAsScout || 0
                  : allTimePoints?.pointsEarnedAsScout || 0}
              </Typography>
              <Image src='/images/profile/scout-game-orange-icon.svg' width='25' height='25' alt='scout icon' />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

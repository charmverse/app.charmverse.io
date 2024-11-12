'use client';

import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { useMdScreen } from '../../../../hooks/useMediaScreens';

export function PublicBuilderStats({
  allTimePoints,
  seasonPoints,
  totalScouts,
  totalNftsSold
}: {
  seasonPoints?: number;
  allTimePoints?: number;
  totalScouts?: number;
  totalNftsSold?: number;
}) {
  const isDesktop = useMdScreen();
  return (
    <Stack gap={0.5}>
      <Typography fontWeight={500} color='secondary' variant={isDesktop ? 'subtitle1' : 'caption'}>
        THIS SEASON (ALL TIME)
      </Typography>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'h6'} color='orange.main'>
          {seasonPoints || 0}
        </Typography>
        <Image src='/images/profile/scout-game-orange-icon.svg' width='25' height='25' alt='scout game icon' />
        <Typography fontWeight={500} variant={isDesktop ? 'h6' : 'body1'} color='orange.main'>
          ({allTimePoints || 0})
        </Typography>
      </Stack>
      <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'h6'} color='orange.main'>
        {totalScouts || 0} Scouts
      </Typography>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'h6'} color='orange.main'>
          {totalNftsSold || 0}
        </Typography>
        <Image src='/images/profile/icons/cards-orange.svg' width='20' height='20' alt='cards icon' />
        <Typography fontWeight={500} variant={isDesktop ? 'h5' : 'h6'} color='orange.main'>
          Sold
        </Typography>
      </Stack>
    </Stack>
  );
}

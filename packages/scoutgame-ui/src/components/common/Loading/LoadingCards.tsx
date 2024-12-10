'use client';

import { Skeleton, Stack } from '@mui/material';

import { useMdScreen } from '../../../hooks/useMediaScreens';

export function LoadingCards({ count }: { count?: number }) {
  const isDesktop = useMdScreen();
  count = count || (isDesktop ? 5 : 2);
  return (
    <Stack gap={1} flexDirection='row' px={{ xs: 0, md: 4 }} mb={2}>
      {new Array(count).fill('').map(() => (
        <Stack key={Math.random() * 1000} width='100%' gap={0.5}>
          <Skeleton
            animation='wave'
            variant='rectangular'
            height={isDesktop ? 275 : 180}
            sx={{ borderRadius: '5px' }}
          />
          <Skeleton animation='wave' variant='rectangular' height={50} sx={{ borderRadius: '5px' }} />
        </Stack>
      ))}
    </Stack>
  );
}

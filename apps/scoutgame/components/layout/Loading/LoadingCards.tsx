'use client';

import type { Theme } from '@mui/material';
import { Skeleton, Stack, useMediaQuery } from '@mui/material';

export function LoadingCards() {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <Stack gap={1} flexDirection='row' px={{ xs: 0, md: 4 }} mb={2}>
      {new Array(isMobile ? 2 : 5).fill('').map(() => (
        <Stack key={Math.random() * 1000} width='100%' gap={0.5}>
          <Skeleton animation='wave' variant='rectangular' height={260} sx={{ borderRadius: '5px' }} />
          <Skeleton animation='wave' variant='rectangular' height={50} sx={{ borderRadius: '5px' }} />
        </Stack>
      ))}
    </Stack>
  );
}

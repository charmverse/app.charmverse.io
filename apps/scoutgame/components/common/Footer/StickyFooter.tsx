'use client';

import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';

import { MenuItems } from '../MenuItems';

export function StickyFooter() {
  const isBigScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));

  if (isBigScreen) {
    return <Box component='footer' />;
  }

  return <MenuItems />;
}

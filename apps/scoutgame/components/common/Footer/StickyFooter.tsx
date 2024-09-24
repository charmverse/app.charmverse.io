'use client';

import { Box } from '@mui/material';

import { useMdScreen } from 'hooks/useMediaScreens';

import { SiteNavigation } from '../SiteNavigation';

export function StickyFooter() {
  const isBigScreen = useMdScreen();

  if (isBigScreen) {
    return <Box component='footer' />;
  }

  return <SiteNavigation />;
}

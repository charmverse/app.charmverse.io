'use client';

import ProfileIcon from '@mui/icons-material/AccountBox';
import GrantIcon from '@mui/icons-material/Feed';
import FeedIcon from '@mui/icons-material/Newspaper';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function StickyFooter() {
  const pathname = usePathname();

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation showLabels value={getActiveButton(pathname)}>
        <BottomNavigationAction
          label='Profile'
          href='/profile'
          value='profile'
          icon={<ProfileIcon fontSize='small' />}
          sx={{ gap: '4px' }}
        />
        <BottomNavigationAction label='Feed' href='feed' value='feed' icon={<FeedIcon />} sx={{ gap: '4px' }} />
        <BottomNavigationAction label='Grants' href='grants' value='grants' icon={<GrantIcon />} sx={{ gap: '4px' }} />
      </BottomNavigation>
    </Paper>
  );
}

function getActiveButton(pathname: string) {
  if (pathname.includes('profile')) {
    return 'profile';
  } else if (pathname.includes('feed')) {
    return 'feed';
  } else if (pathname.includes('grants')) {
    return 'grants';
  }
  return 'profile';
}

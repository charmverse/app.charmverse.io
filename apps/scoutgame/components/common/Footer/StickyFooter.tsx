'use client';

import ProfileIcon from '@mui/icons-material/AccountBox';
import GrantIcon from '@mui/icons-material/Feed';
import FeedIcon from '@mui/icons-material/Newspaper';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { usePathname } from 'next/navigation';

export function StickyFooter() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  return (
    <>
      {/* include element to add spacing at the bottom of the page */}
      <Box height='56px' />
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderRadius: 0 }} elevation={3}>
        <BottomNavigation showLabels value={getActiveButton(pathname)}>
          <BottomNavigationAction
            label='Profile'
            href='/profile'
            value='profile'
            icon={<ProfileIcon />}
            sx={{ gap: '2px' }}
          />
          <BottomNavigationAction label='Feed' href='/feed' value='feed' icon={<FeedIcon />} sx={{ gap: '2px' }} />
          <BottomNavigationAction
            label='Grants'
            href='/grants'
            value='grants'
            icon={<GrantIcon />}
            sx={{ gap: '2px' }}
          />
        </BottomNavigation>
      </Paper>
    </>
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

'use client';

import GrantIcon from '@mui/icons-material/Feed';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { usePathname } from 'next/navigation';
import { CiBellOn } from 'react-icons/ci';
import { GoHome } from 'react-icons/go';
import { MdPersonOutline } from 'react-icons/md';
import { PiBinoculars } from 'react-icons/pi';

export function StickyFooter() {
  const pathname = usePathname();
  const value = getActiveButton(pathname);

  return (
    <Paper elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        sx={{
          background: 'linear-gradient(88.35deg, #96CDFF 0%, #A06CD5 29.5%, #96CDFF 75.47%, #A06CD5 100%)',
          '& > a': {
            color: 'black.main',
            gap: '2px',
            '&.Mui-selected': {
              color: 'text.primary',
              bgcolor: 'rgba(44, 0, 90, 0.25)'
            }
          }
        }}
      >
        <BottomNavigationAction label='Home' href='/home' value='home' icon={<GoHome size='1.6rem' />} />
        <BottomNavigationAction label='Scout' href='/scout' value='scout' icon={<PiBinoculars size='1.6rem' />} />
        <BottomNavigationAction
          label='Notifications'
          href='/notifications'
          value='notifications'
          icon={<CiBellOn size='1.6rem' />}
        />
        <BottomNavigationAction
          label='Profile'
          href='/profile'
          value='profile'
          icon={<MdPersonOutline size='1.6rem' />}
        />
      </BottomNavigation>
    </Paper>
  );
}

function getActiveButton(pathname: string) {
  if (pathname.includes('home')) {
    return 'home';
  } else if (pathname.includes('scout')) {
    return 'scout';
  } else if (pathname.includes('notifications')) {
    return 'notifications';
  } else if (pathname.includes('profile')) {
    return 'profile';
  }
  return 'home';
}

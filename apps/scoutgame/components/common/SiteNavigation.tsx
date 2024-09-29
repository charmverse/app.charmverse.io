'use client';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { styled } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import { CiBellOn } from 'react-icons/ci';
import { PiBinocularsLight, PiHouseLight } from 'react-icons/pi';
import { SlUser } from 'react-icons/sl';

const StyledBottomNavigation = styled(BottomNavigation, {
  shouldForwardProp: (prop) => prop !== 'topNav'
})<{ topNav?: boolean }>(({ theme, topNav }) => ({
  background: topNav
    ? 'transparent'
    : 'linear-gradient(88.35deg, #96CDFF 0%, #A06CD5 29.5%, #96CDFF 75.47%, #A06CD5 100%)',
  '& > a': {
    color: topNav ? theme.palette.text.primary : theme.palette.common.black,
    gap: '2px',
    width: topNav ? '110px' : 'auto',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    '&.Mui-selected': {
      color: theme.palette.text.primary,
      backgroundColor: topNav ? theme.palette.primary.main : 'rgba(44, 0, 90, 0.25)'
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '.75rem'
    }
  }
}));

export function SiteNavigation({ topNav }: { topNav?: boolean }) {
  const pathname = usePathname();
  const value = getActiveButton(pathname);
  return (
    <StyledBottomNavigation showLabels value={value} data-test='site-navigation' topNav={topNav}>
      <BottomNavigationAction label='Home' href='/home' value='home' icon={<PiHouseLight size='24px' />} />
      <BottomNavigationAction label='Scout' href='/scout' value='scout' icon={<PiBinocularsLight size='24px' />} />
      <BottomNavigationAction
        label='Notifications'
        href='/notifications'
        value='notifications'
        icon={<CiBellOn size='26px' style={{ margin: '-1px 0' }} />}
      />
      <BottomNavigationAction
        label='Profile'
        href='/profile'
        value='profile'
        icon={<SlUser size='19px' style={{ margin: '1px 0' }} />}
      />
    </StyledBottomNavigation>
  );
}

function getActiveButton(pathname: string) {
  if (pathname.startsWith('/home')) {
    return 'home';
  } else if (pathname.startsWith('/scout') || pathname.startsWith('/u/')) {
    return 'scout';
  } else if (pathname.startsWith('/notifications')) {
    return 'notifications';
  } else if (pathname.startsWith('/profile')) {
    return 'profile';
  }
  return null;
}

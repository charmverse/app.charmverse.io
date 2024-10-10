'use client';

import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiBinocularsLight, PiHouseLight } from 'react-icons/pi';

import { useMdScreen } from 'hooks/useMediaScreens';

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
    '&.MuiButtonBase-root': {
      minWidth: '60px'
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '.75rem'
    }
  }
}));

export function SiteNavigation({ topNav, isAuthenticated = false }: { topNav?: boolean; isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const value = getActiveButton(pathname);
  return (
    <StyledBottomNavigation showLabels value={value} data-test='site-navigation' topNav={topNav}>
      <BottomNavigationAction
        label='Repos'
        href='/repos'
        value='repos'
        icon={<PiHouseLight size='24px' />}
        LinkComponent={Link}
      />
      {/* <BottomNavigationAction
        label='Users'
        href='/users'
        value='users'
        icon={<PiBinocularsLight size='24px' />}
        LinkComponent={Link}
      /> */}
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
  } else if (pathname.startsWith('/info')) {
    return 'info';
  }
  return null;
}

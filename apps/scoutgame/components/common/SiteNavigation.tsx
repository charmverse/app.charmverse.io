'use client';

import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { PiBinocularsLight, PiHouseLight, PiInfoLight } from 'react-icons/pi';
import { SlUser } from 'react-icons/sl';

import { useUser } from 'components/layout/UserProvider';
import { useGetClaimablePoints } from 'hooks/api/session';
import { useMdScreen } from 'hooks/useMediaScreens';

import { ClaimIcon } from './ClaimIcon';
import { SignInModalMessage } from './ScoutButton/SignInModalMessage';

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

export function SiteNavigation({ topNav }: { topNav?: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();
  const isAuthenticated = Boolean(user);
  const value = getActiveButton(pathname);
  const isDesktop = useMdScreen();
  const { data: claimablePoints } = useGetClaimablePoints();
  const [authPopup, setAuthPopup] = useState({
    open: false,
    path: '/home'
  });

  const openAuthModal = isAuthenticated
    ? undefined
    : (e: MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        setAuthPopup({ open: true, path });
      };

  return (
    <>
      <StyledBottomNavigation showLabels value={value} data-test='site-navigation' topNav={topNav}>
        <BottomNavigationAction
          label='Home'
          href='/home'
          value='home'
          icon={<PiHouseLight size='24px' />}
          LinkComponent={Link}
        />
        <BottomNavigationAction
          label='Scout'
          href='/scout'
          value='scout'
          icon={<PiBinocularsLight size='24px' />}
          LinkComponent={Link}
        />
        <BottomNavigationAction
          LinkComponent={Link}
          label='Claim'
          href='/claim'
          value='claim'
          icon={<ClaimIcon animate={claimablePoints && claimablePoints.points > 0} />}
          onClick={(e) => openAuthModal?.(e, 'claim')}
        />
        <BottomNavigationAction
          LinkComponent={Link}
          label='Profile'
          // This makes sure the UI doesn't flicker from single column to double column for desktop screens
          href={isDesktop ? '/profile?tab=scout-build' : '/profile'}
          value='profile'
          icon={<SlUser size='19px' style={{ margin: '2px 0 3px' }} />}
          onClick={(e) => openAuthModal?.(e, 'profile')}
        />
        <BottomNavigationAction
          LinkComponent={Link}
          label='Info'
          // This makes sure the UI doesn't flicker from single column to double column for desktop screens
          href='/info'
          value='info'
          icon={<PiInfoLight size='24px' />}
        />
      </StyledBottomNavigation>
      <SignInModalMessage
        open={authPopup.open}
        onClose={() => setAuthPopup({ open: false, path: '/home' })}
        path={authPopup.path}
      />
    </>
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
  } else if (pathname.startsWith('/claim')) {
    return 'claim';
  }
  return null;
}

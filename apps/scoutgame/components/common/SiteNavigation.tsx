'use client';

import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import { SignInModalMessage } from '@packages/scoutgame-ui/components/common/ScoutButton/SignInModalMessage';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { ImGift as QuestsIcon } from 'react-icons/im';
import { PiBinocularsLight } from 'react-icons/pi';
import { SlUser } from 'react-icons/sl';

import { useGetClaimablePoints } from 'hooks/api/session';

import { BuilderIcon } from './BuilderIcon';
import { ClaimIcon } from './Icons/ClaimIcon';

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
    path: '/scout'
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
          label='Scout'
          href='/scout'
          value='scout'
          icon={<PiBinocularsLight size='24px' />}
          LinkComponent={Link}
        />
        <BottomNavigationAction
          label='Builders'
          href='/builders'
          value='builders'
          icon={<BuilderIcon />}
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
        {user ? (
          <BottomNavigationAction
            LinkComponent={Link}
            label='Profile'
            // This makes sure the UI doesn't flicker from single column to double column for desktop screens
            href={isDesktop ? '/profile?tab=scout-build' : '/profile'}
            value='profile'
            icon={<SlUser size='19px' style={{ margin: '2px 0 3px' }} />}
            onClick={(e) => openAuthModal?.(e, 'profile')}
          />
        ) : null}
        <BottomNavigationAction
          label='Quests'
          href='/quests'
          value='quests'
          icon={<QuestsIcon size='19px' />}
          LinkComponent={Link}
          onClick={(e) => openAuthModal?.(e, 'quests')}
        />
      </StyledBottomNavigation>
      <SignInModalMessage
        open={authPopup.open}
        onClose={() => setAuthPopup({ open: false, path: authPopup.path })}
        path={authPopup.path}
      />
    </>
  );
}

function getActiveButton(pathname: string) {
  if (pathname.startsWith('/scout') || pathname.startsWith('/u/')) {
    return 'scout';
  } else if (pathname.startsWith('/profile')) {
    return 'profile';
  } else if (pathname.startsWith('/info')) {
    return 'info';
  } else if (pathname.startsWith('/claim')) {
    return 'claim';
  } else if (pathname.startsWith('/builders')) {
    return 'builders';
  } else if (pathname.startsWith('/quests')) {
    return 'quests';
  }
  return null;
}

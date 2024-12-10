'use client';

import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import { getPlatform } from '@packages/mixpanel/utils';
import { BuilderIcon } from '@packages/scoutgame-ui/components/common/Icons/BuilderIcon';
import { ClaimIcon } from '@packages/scoutgame-ui/components/common/Icons/ClaimIcon';
import { SignInModalMessage } from '@packages/scoutgame-ui/components/common/ScoutButton/SignInModalMessage';
import { useGetClaimablePoints } from '@packages/scoutgame-ui/hooks/api/session';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { ImGift as QuestsIcon } from 'react-icons/im';
import { PiBinocularsLight as ScoutIcon } from 'react-icons/pi';

const StyledBottomNavigation = styled(BottomNavigation, {
  shouldForwardProp: (prop) => prop !== 'topNav' && prop !== 'isTelegram'
})<{ topNav?: boolean; isTelegram?: boolean }>(({ theme, topNav, isTelegram }) => ({
  background: topNav
    ? 'transparent'
    : 'linear-gradient(88.35deg, #96CDFF 0%, #A06CD5 29.5%, #96CDFF 75.47%, #A06CD5 100%)',
  height: isTelegram ? '71px' : undefined,
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
      paddingBottom: isTelegram ? '15px' : undefined,
      minWidth: '60px'
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '.75rem'
    }
  }
}));

export function SiteNavigation({ topNav }: { topNav?: boolean }) {
  const platform = getPlatform();
  const pathname = usePathname();
  const { user } = useUser();
  const isAuthenticated = Boolean(user);
  const value = getActiveButton(pathname);
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
      <StyledBottomNavigation
        showLabels
        value={value}
        data-test='site-navigation'
        topNav={topNav}
        isTelegram={platform === 'telegram'}
      >
        <BottomNavigationAction
          label='Scout'
          href='/scout'
          value='scout'
          icon={<ScoutIcon size='24px' />}
          LinkComponent={Link}
        />
        {platform === 'webapp' && (
          <BottomNavigationAction
            label='Builders'
            href='/builders'
            value='builders'
            icon={<BuilderIcon />}
            LinkComponent={Link}
          />
        )}
        <BottomNavigationAction
          LinkComponent={Link}
          label='Claim'
          href='/claim'
          value='claim'
          icon={<ClaimIcon animate={claimablePoints && claimablePoints.points > 0} />}
          onClick={(e) => openAuthModal?.(e, 'claim')}
        />
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
  } else if (pathname.startsWith('/claim')) {
    return 'claim';
  } else if (pathname.startsWith('/builders')) {
    return 'builders';
  } else if (pathname.startsWith('/quests')) {
    return 'quests';
  }
  return null;
}

'use client';

import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import { FriendsIcon } from '@packages/scoutgame-ui/components/common/Icons/FriendsIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ClaimIcon } from './Icons/ClaimIcon';
import { QuestsIcon } from './Icons/QuestsIcon';
import { ScoutIcon } from './Icons/ScoutIcon';

const StyledBottomNavigation = styled(BottomNavigation, {
  shouldForwardProp: (prop) => prop !== 'topNav' && prop !== 'isTelegram'
})<{ topNav?: boolean; isTelegram?: boolean }>(({ theme, topNav, isTelegram }) => ({
  background: topNav
    ? 'transparent'
    : 'linear-gradient(88.35deg, #96CDFF 0%, #A06CD5 29.5%, #96CDFF 75.47%, #A06CD5 100%)',
  height: isTelegram ? '71px' : '56px',
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
      paddingBottom: isTelegram ? '15px' : '0',
      minWidth: '60px'
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '.75rem'
    }
  }
}));

export function SiteNavigation({ topNav, isTelegram }: { topNav?: boolean; isTelegram?: boolean }) {
  const pathname = usePathname();
  const value = getActiveButton(pathname);

  return (
    <StyledBottomNavigation
      showLabels
      value={value}
      data-test='site-navigation'
      topNav={topNav}
      isTelegram={isTelegram}
    >
      <BottomNavigationAction
        label='Quests'
        href='/quests'
        value='quests'
        icon={<QuestsIcon active={value === 'quests'} />}
        LinkComponent={Link}
      />
      <BottomNavigationAction
        label='Scout'
        href='/scout'
        value='scout'
        icon={<ScoutIcon active={value === 'scout'} />}
        LinkComponent={Link}
      />
      <BottomNavigationAction
        label='Claim'
        href='/claim'
        value='claim'
        icon={<ClaimIcon active={value === 'claim'} />}
        LinkComponent={Link}
      />
      <BottomNavigationAction
        label='Friends'
        href='/friends'
        value='friends'
        icon={<FriendsIcon fill={value === 'friends' ? '#fff' : '#000'} />}
        LinkComponent={Link}
      />
    </StyledBottomNavigation>
  );
}

function getActiveButton(pathname: string) {
  if (pathname.startsWith('/quests')) {
    return 'quests';
  } else if (pathname.startsWith('/friends')) {
    return 'friends';
  } else if (pathname.startsWith('/scout') || pathname.startsWith('/u')) {
    return 'scout';
  } else if (pathname.startsWith('/claim')) {
    return 'claim';
  }
  return null;
}

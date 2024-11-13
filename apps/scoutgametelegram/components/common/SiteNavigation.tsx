'use client';

import { BottomNavigation, BottomNavigationAction, styled } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const value = getActiveButton(pathname);

  return (
    <StyledBottomNavigation showLabels value={value} data-test='site-navigation' topNav={topNav}>
      <BottomNavigationAction
        label='Quests'
        href='/quests'
        value='quests'
        icon={<Image src='/images/quests-icon.svg' width={24} height={24} alt='Quests' />}
        LinkComponent={Link}
      />
      <BottomNavigationAction
        label='Scout'
        href='/scout'
        value='scout'
        icon={<Image src='/images/scout-binoculars.svg' width={24} height={24} alt='Scout' />}
        LinkComponent={Link}
      />
      <BottomNavigationAction
        label='Claim'
        href='/claim'
        value='claim'
        icon={<Image src='/images/claim-icon.svg' width={24} height={24} alt='Claim' />}
        LinkComponent={Link}
      />
      <BottomNavigationAction
        label='Friends'
        href='/friends'
        value='friends'
        icon={<Image src='/images/friends-2-icon.svg' width={24} height={24} alt='Friends' />}
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
  } else if (pathname.startsWith('/scout')) {
    return 'scout';
  } else if (pathname.startsWith('/claim')) {
    return 'claim';
  }
  return null;
}

'use client';

import type { Theme } from '@mui/material';
import { useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TabsMenu } from 'components/common/Tabs/TabsMenu';
import { useMdScreen } from 'hooks/useMediaScreens';

import type { ProfileTab } from '../ProfilePage';

const desktopTabs = ['scout-build', 'win'];
const mobileTabs = ['scout', 'build', 'win'];

export function ProfileTabsMenu({ tab }: { tab: ProfileTab }) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const isDesktop = useMdScreen();
  const router = useRouter();

  // Initially both mobile and desktop is set to false, without returning early the UI flickers

  useEffect(() => {
    if (!isMobile && !isDesktop) {
      return;
    }

    if (!isMobile) {
      const isValidTab = desktopTabs.includes(tab);
      if (!isValidTab) {
        router.push('/profile?tab=scout-build');
      }
    } else {
      const isValidTab = mobileTabs.includes(tab);
      if (!isValidTab) {
        router.push('/profile?tab=scout');
      }
    }
  }, [tab, isMobile, isDesktop, router]);

  if (!isMobile && !isDesktop) {
    return null;
  }

  if (!isMobile) {
    return (
      <TabsMenu
        value={tab || 'scout-build'}
        tabs={[
          { value: 'scout-build', label: 'Scout. Build.', href: '/profile?tab=scout-build' },
          { value: 'win', label: 'Win', href: '/profile?tab=win' }
        ]}
      />
    );
  }

  return (
    <TabsMenu
      value={tab || 'scout'}
      tabs={[
        { value: 'scout', label: 'Scout', href: '/profile?tab=scout' },
        { value: 'build', label: 'Build', href: '/profile?tab=build' },
        { value: 'win', label: 'Win', href: '/profile?tab=win' }
      ]}
    />
  );
}

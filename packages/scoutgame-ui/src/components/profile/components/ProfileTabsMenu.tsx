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
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const isDesktop = useMdScreen();
  const router = useRouter();

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

  // Initially both mobile and desktop is set to false, without returning early the UI flickers
  if (!isMobile && !isDesktop) {
    return null;
  }

  if (!isMobile) {
    return null;
  }

  return (
    <TabsMenu
      value={tab || 'scout'}
      tabs={[
        { value: 'scout', label: 'Scout' },
        { value: 'build', label: 'Build' }
      ]}
    />
  );
}

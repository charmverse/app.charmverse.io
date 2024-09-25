'use client';

import { TabsMenu } from 'components/common/Tabs/TabsMenu';
import { useMdScreen } from 'hooks/useMediaScreens';

import type { ProfileTab } from './ProfilePage';

export function ProfileTabsMenu({ tab }: { tab: ProfileTab }) {
  const isDesktop = useMdScreen();

  if (isDesktop) {
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

import { TabsMenu } from 'components/common/Tabs/TabsMenu';

import type { ProfileTab } from './ProfilePage/ProfilePage';

export function DesktopProfileTabsMenu({ tab }: { tab: ProfileTab }) {
  return (
    <TabsMenu
      value={tab}
      tabs={[
        { value: 'scout', label: 'Scout. Build.', href: '/profile?tab=scout' },
        { value: 'win', label: 'Win', href: '/profile?tab=win' }
      ]}
    />
  );
}

export function MobileProfileTabsMenu({ tab }: { tab: ProfileTab }) {
  return (
    <TabsMenu
      value={tab}
      tabs={[
        { value: 'scout', label: 'Scout', href: '/profile?tab=scout' },
        { value: 'build', label: 'Build', href: '/profile?tab=build' },
        { value: 'win', label: 'Win', href: '/profile?tab=win' }
      ]}
    />
  );
}

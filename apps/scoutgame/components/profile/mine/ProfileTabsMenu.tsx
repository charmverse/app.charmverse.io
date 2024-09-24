import { TabsMenu } from 'components/common/Tabs/TabsMenu';

import type { ProfileTab } from './ProfilePage';

export function ProfileTabsMenu({ tab }: { tab: ProfileTab }) {
  return (
    <TabsMenu
      value={tab}
      tabs={[
        { value: 'scout', label: 'Scout', href: '/profile/mine?tab=scout' },
        { value: 'build', label: 'Build', href: '/profile/mine?tab=build' },
        { value: 'win', label: 'Win', href: '/profile/mine?tab=win' }
      ]}
    />
  );
}

import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export function PublicProfileTabs({ tab, username }: { tab: string; username: string }) {
  const value = ['scout', 'builder'].includes(tab) ? tab : 'scout';

  return (
    <TabsMenu
      value={value}
      tabs={[
        { value: 'scout', label: 'Scout', href: `/u/${username}/?tab=scout` },
        { value: 'builder', label: 'Builder', href: `/u/${username}/?tab=builder` }
      ]}
    />
  );
}

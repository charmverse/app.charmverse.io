import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export function PublicProfileTabsMenu({ tab, username }: { tab: string; username: string }) {
  const value = ['scout', 'build'].includes(tab) ? tab : 'scout';

  return (
    <TabsMenu
      value={value}
      tabs={[
        { value: 'scout', label: 'Scout', href: `/u/${username}/?tab=scout` },
        { value: 'build', label: 'Build', href: `/u/${username}/?tab=build` }
      ]}
    />
  );
}

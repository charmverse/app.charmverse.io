import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export function PublicProfileTabsMenu({ tab, username }: { tab: string; username: string }) {
  return (
    <TabsMenu
      value={tab}
      tabs={[
        { value: 'scout', label: 'Scout', href: `/u/${username}/?tab=scout` },
        { value: 'build', label: 'Build', href: `/u/${username}/?tab=build` }
      ]}
    />
  );
}

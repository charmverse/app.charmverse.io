import type { TabItem } from 'components/common/Tabs/TabsMenu';
import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export const homeTabs: TabItem[] = [
  { label: 'Leaderboard', value: 'leaderboard' },
  { label: 'Activity', value: 'activity' },
  { label: 'Top Scouts', value: 'top-scouts' },
  { label: 'Top Builders', value: 'top-builders' }
];

export function HomeTabsMenu({ tab }: { tab: string }) {
  // @TODO: When clicked, the content below the tabs should dissapear and the skeleton should appear and then the new content. Somehow this behaviour stopped working.
  return <TabsMenu value={tab} tabs={homeTabs} sx={{ mb: 2 }} />;
}

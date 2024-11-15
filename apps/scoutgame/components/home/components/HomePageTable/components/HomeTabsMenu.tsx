import type { TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { TabsMenu } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';

export const homeTabs: TabItem[] = [
  { label: 'Leaderboard', value: 'leaderboard' },
  { label: 'Activity', value: 'activity' },
  { label: 'Top Scouts', value: 'top-scouts' },
  { label: 'New Scouts', value: 'new-scouts' },
  { label: 'Top Builders', value: 'top-builders' }
];

export function HomeTabsMenu({ tab }: { tab: string }) {
  return <TabsMenu value={tab} tabs={homeTabs} sx={{ mb: 2, width: '100%' }} />;
}

import type { TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { TabsMenu } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';

export const scoutTabs: TabItem[] = [
  { label: 'Scouts', value: 'scouts' },
  { label: 'Builders', value: 'builders' }
];

export function ScoutTabsMenu({ tab }: { tab: string }) {
  // @TODO: When clicked, the content below the tabs should disappear and the skeleton should appear and then the new content. Somehow this behaviour stopped working.
  return <TabsMenu value={tab} tabs={scoutTabs} sx={{ mb: 1 }} />;
}

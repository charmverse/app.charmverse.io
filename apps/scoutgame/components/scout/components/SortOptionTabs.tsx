import type { TabItem } from 'components/common/Tabs/TabsMenu';
import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export const sortOptions: TabItem[] = [
  { label: 'Top', value: 'top' },
  { label: 'Hot', value: 'hot' },
  { label: 'New', value: 'new' }
];

export function SortOptionTabs({ value }: { value: string }) {
  return <TabsMenu value={value} tabs={sortOptions} sx={{ mb: 2 }} />;
}

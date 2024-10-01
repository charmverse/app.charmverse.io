import type { TabItem } from 'components/common/Tabs/TabsMenu';
import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export const sortOptions: TabItem[] = [
  { label: 'Top', href: '?sort=top', value: 'top' },
  { label: 'Hot', href: '?sort=hot', value: 'hot' },
  { label: 'New', href: '?sort=new', value: 'new' }
];

export function SortOptionTabs({ value }: { value: string }) {
  return <TabsMenu value={value} tabs={sortOptions} sx={{ mb: 2 }} />;
}

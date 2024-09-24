import { Box, Tab, Tabs, tabClasses, tabsClasses } from '@mui/material';
import Link from 'next/link';

export type TabItem = {
  label: string;
  href: string;
  value: string;
};

type TabsMenuProps = {
  value: string;
  tabs: TabItem[];
};

export function TabsMenu({ value, tabs }: TabsMenuProps) {
  const tabValue = tabs.some((t) => t.value === value) ? value : false;
  return (
    <Box>
      <Tabs
        value={tabValue}
        aria-label='scout game nav tabs'
        role='navigation'
        variant='scrollable'
        scrollButtons='auto'
        sx={{
          [`& .${tabsClasses.flexContainer}`]: {
            justifyContent: 'center'
          },
          [`& .${tabsClasses.indicator}`]: {
            bottom: 3
          },
          [`& .${tabClasses.root}`]: {
            borderBottom: '1px solid',
            borderColor: 'text.primary'
          }
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} component={Link} label={tab.label} href={tab.href} value={tab.value} scroll={false} />
        ))}
      </Tabs>
    </Box>
  );
}

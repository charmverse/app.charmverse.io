import type { SxProps } from '@mui/material';
import { Badge, Box, Tab, Tabs, tabClasses, tabsClasses } from '@mui/material';
import Link from 'next/link';

export type TabItem = {
  label: string;
  value: string;
  showBadge?: boolean;
};

type TabsMenuProps = {
  value: string;
  tabs: TabItem[];
  sx?: SxProps;
};

export function TabsMenu({ value, tabs, sx }: TabsMenuProps) {
  const tabValue = tabs.some((t) => t.value === value) ? value : false;
  return (
    <Box sx={sx}>
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
            bottom: {
              xs: 8,
              md: 5
            },
            height: '1px'
          },
          [`& .${tabClasses.root}`]: {
            borderBottom: '1px solid',
            borderColor: 'var(--mui-palette-divider)'
          }
        }}
      >
        {tabs.map((tab) => (
          <Tab
            sx={{ fontSize: { xs: '12px', sm: '14px' } }}
            key={tab.value}
            component={Link}
            label={
              <Badge key={tab.value} color='error' variant='dot' invisible={!tab.showBadge}>
                <Box sx={{ px: 0.5 }}>{tab.label}</Box>
              </Badge>
            }
            href={{
              query: { tab: tab.value }
            }}
            value={tab.value}
            scroll={false}
            data-test={`tab-${tab.value}`}
          />
        ))}
      </Tabs>
    </Box>
  );
}

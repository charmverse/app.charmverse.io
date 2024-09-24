import { Tab, tabClasses, Tabs, tabsClasses } from '@mui/material';
import Link from 'next/link';

import type { ProfileTab } from './ProfilePage';

export function ProfileTabs({ tab }: { tab: ProfileTab }) {
  return (
    <Tabs
      value={tab}
      aria-label='scout game nav tabs'
      role='navigation'
      variant='scrollable'
      scrollButtons='auto'
      sx={{
        [`& .${tabsClasses.flexContainer}`]: {
          justifyContent: { md: 'center' }
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
      <Tab component={Link} label='Scout' href='/profile?tab=scout' value='scout' scroll={false} />
      <Tab component={Link} label='Build' href='/profile?tab=build' value='build' scroll={false} />
      <Tab component={Link} label='Win' href='/profile?tab=win' value='win' scroll={false} />
    </Tabs>
  );
}

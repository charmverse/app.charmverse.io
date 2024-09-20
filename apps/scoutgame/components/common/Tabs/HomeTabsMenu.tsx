import { Box, Tab, Tabs, tabClasses, tabsClasses } from '@mui/material';
import Link from 'next/link';

export function HomeTabsMenu({ tab }: { tab: string }) {
  const value = ['leaderboard', 'activity', 'topscouts', 'topbuilders'].includes(tab) ? tab : 'leaderboard';

  // @TODO: When clicked, the content below the tabs should dissapear and the skeleton should appear and then the new content. Somehow this behaviour stopped working.
  return (
    <Box>
      <Tabs
        value={value}
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
        <Tab component={Link} label='Leaderboard' href='/home?tab=leaderboard' value='leaderboard' scroll={false} />
        <Tab component={Link} label='Activity' href='/home?tab=activity' value='activity' scroll={false} />
        <Tab component={Link} label='Top Scouts' href='/home?tab=topscouts' value='topscouts' scroll={false} />
        <Tab component={Link} label='Top Builders' href='/home?tab=topbuilders' value='topbuilders' scroll={false} />
      </Tabs>
    </Box>
  );
}

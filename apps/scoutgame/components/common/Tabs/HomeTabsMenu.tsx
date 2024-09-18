import { Box, Tab, Tabs } from '@mui/material';
import Link from 'next/link';

export function HomeTabsMenu({ tab }: { tab: string }) {
  const value = ['leaderboard', 'activity', 'topscouts', 'topbuilders'].includes(tab) ? tab : 'leaderboard';

  return (
    <Box maxWidth={{ xs: '95vw', md: 'normal' }}>
      <Tabs
        value={value}
        aria-label='scout game nav tabs'
        role='navigation'
        variant='scrollable'
        scrollButtons='auto'
        sx={{ borderBottom: '1px solid', borderColor: 'text.primary' }}
      >
        <Tab LinkComponent={Link} label='Leaderboard' href='/home?tab=leaderboard' value='leaderboard' />
        <Tab LinkComponent={Link} label='Activity' href='/home?tab=activity' value='activity' />
        <Tab LinkComponent={Link} label='Top Scouts' href='/home?tab=topscouts' value='topscouts' />
        <Tab LinkComponent={Link} label='Top Builders' href='/home?tab=topbuilders' value='topbuilders' />
      </Tabs>
    </Box>
  );
}

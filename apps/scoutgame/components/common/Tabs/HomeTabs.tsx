'use client';

import { Box, Tab, Tabs } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function HomeTabs() {
  const pathname = usePathname();
  const value = getActiveTab(pathname);

  return (
    <Box maxWidth='95vw'>
      <Tabs
        value={value}
        aria-label='scout game nav tabs'
        role='navigation'
        variant='scrollable'
        sx={{ borderBottom: '1px solid', borderColor: 'text.primary' }}
      >
        <Tab LinkComponent={Link} label='Leaderboard' href='/home/leaderboard' value='leaderboard' />
        <Tab LinkComponent={Link} label='Activity' href='/home/activity' value='activity' />
        <Tab LinkComponent={Link} label='Top Scouts' href='/home/topscouts' value='topscouts' />
        <Tab LinkComponent={Link} label='Top Builders' href='/home/topbuilders' value='topbuilders' />
      </Tabs>
    </Box>
  );
}

function getActiveTab(pathname: string) {
  if (pathname.includes('leaderboard')) {
    return 'leaderboard';
  } else if (pathname.includes('activity')) {
    return 'activity';
  } else if (pathname.includes('topscouts')) {
    return 'topscouts';
  } else if (pathname.includes('topbuilders')) {
    return 'topbuilders';
  }
  return 'leaderboard';
}

import 'server-only';

import Box from '@mui/material/Box';

import { PublicBuilderProfile } from './PublicBuilderProfile';
import { PublicProfileTabsMenu } from './PublicProfileTabsMenu';
import { PublicScoutProfile } from './PublicScoutProfile';

export async function PublicProfilePage({ userId, username, tab }: { userId: string; username: string; tab: string }) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      <PublicProfileTabsMenu tab={tab} username={username} />
      {tab === 'builder' ? <PublicBuilderProfile builderId={userId} /> : <PublicScoutProfile scoutId={userId} />}
    </Box>
  );
}

import 'server-only';

import Box from '@mui/material/Box';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';

export async function PublicProfilePage({ userId, username, tab }: { userId: string; username: string; tab: string }) {
  return (
    <Box p={1} gap={2} display='flex' flexDirection='column' maxWidth='1240px' margin='auto'>
      {tab === 'build' ? (
        <PublicBuilderProfile builderId={userId} tab={tab} />
      ) : (
        <PublicScoutProfile scoutId={userId} tab={tab} />
      )}
    </Box>
  );
}

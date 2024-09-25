import 'server-only';

import Box from '@mui/material/Box';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';

export async function PublicProfilePage({ userId, username, tab }: { userId: string; username: string; tab: string }) {
  return (
    <Box gap={2} display='flex' flexDirection='column' margin='auto'>
      {tab === 'build' ? (
        <PublicBuilderProfile builderId={userId} tab={tab} user={{ username }} />
      ) : (
        <PublicScoutProfile scoutId={userId} tab={tab} />
      )}
    </Box>
  );
}

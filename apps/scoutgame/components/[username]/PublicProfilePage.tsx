import 'server-only';

import Box from '@mui/material/Box';

import type { BasicUserInfo } from 'lib/users/interfaces';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';

export async function PublicProfilePage({ user, tab }: { user: BasicUserInfo; tab: string }) {
  return (
    <Box gap={2} display='flex' flexDirection='column' margin='auto'>
      {tab === 'build' ? <PublicBuilderProfile tab={tab} user={user} /> : <PublicScoutProfile tab={tab} user={user} />}
    </Box>
  );
}

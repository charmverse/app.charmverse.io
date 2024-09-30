import 'server-only';

import Box from '@mui/material/Box';

import type { BasicUserInfo } from 'lib/users/interfaces';

import { PageContainer } from '../layout/PageContainer';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';

export async function PublicProfilePage({ user, tab }: { user: BasicUserInfo; tab: string }) {
  return (
    <PageContainer>
      <Box gap={2} display='flex' flexDirection='column' margin='auto'>
        {tab === 'builder' && user.builderStatus === 'approved' ? (
          <PublicBuilderProfile tab={tab} user={user} />
        ) : (
          <PublicScoutProfile tab={tab} user={user} />
        )}
      </Box>
    </PageContainer>
  );
}

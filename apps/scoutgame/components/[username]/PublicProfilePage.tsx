import 'server-only';

import { Box, Stack, Paper, Typography } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { Hidden } from 'components/common/Hidden';
import { UserProfile } from 'components/common/Profile/UserProfile';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { PageContainer } from '../layout/PageContainer';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';
import { PublicProfileTabsMenu } from './PublicProfileTabsMenu';

export async function PublicProfilePage({ user, tab }: { user: BasicUserInfo; tab: string }) {
  return (
    <PageContainer>
      <Box gap={2} display='flex' flexDirection='column' margin='auto'>
        <Hidden mdDown>
          <Paper sx={{ py: 2, mt: { xs: 1, md: 2 } }}>
            <Stack flexDirection='row'>
              <BackButton />
              <Box width='calc(100% - 50px)'>
                <UserProfile user={user} avatarSize='xLarge' />
              </Box>
            </Stack>
          </Paper>
        </Hidden>
        <PublicProfileTabsMenu
          tab={tab}
          username={user.username}
          isApprovedBuilder={user.builderStatus === 'approved'}
        />
        {tab === 'builder' && user.builderStatus === 'approved' ? (
          <PublicBuilderProfile tab={tab} user={user} />
        ) : (
          <PublicScoutProfile tab={tab} user={user} />
        )}
      </Box>
    </PageContainer>
  );
}

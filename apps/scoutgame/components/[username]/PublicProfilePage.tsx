import 'server-only';

import { Box, Stack, Paper } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { Hidden } from 'components/common/Hidden';
import { UserProfile } from 'components/common/Profile/UserProfile';
import type { BasicUserInfo } from 'lib/users/interfaces';

import { PageContainer } from '../layout/PageContainer';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';
import { PublicProfileTabsMenu } from './PublicProfileTabsMenu';

export function PublicProfilePage({ user, tab }: { user: BasicUserInfo; tab: string }) {
  return (
    <PageContainer>
      <Box gap={2} display='flex' flexDirection='column' margin='auto'>
        <Hidden mdDown>
          <Paper sx={{ py: 2, mt: { xs: 1, md: 2 } }}>
            <Stack flexDirection='row' alignItems='center' pl={0.5}>
              <div>
                <BackButton />
              </div>
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
          <PublicBuilderProfile publicUser={user} />
        ) : (
          <PublicScoutProfile publicUser={user} />
        )}
      </Box>
    </PageContainer>
  );
}

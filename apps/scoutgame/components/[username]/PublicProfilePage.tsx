import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Box, Stack, Paper } from '@mui/material';

import { BackButton } from 'components/common/Button/BackButton';
import { Hidden } from 'components/common/Hidden';
import { UserProfile } from 'components/common/Profile/UserProfile';
import type { BasicUserInfo, BuilderUserInfo } from 'lib/users/interfaces';

import { PageContainer } from '../layout/PageContainer';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';
import { PublicProfileTabsMenu } from './PublicProfileTabsMenu';

type UserProfile = BasicUserInfo & { displayName: string; builderStatus: BuilderStatus | null };

export function PublicProfilePage({ user, tab }: { user: UserProfile; tab: string }) {
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
          isApprovedBuilder={user.builderStatus === 'approved' || user.builderStatus === 'banned'}
        />
        {tab === 'builder' ? (
          <PublicBuilderProfile builder={user as BuilderUserInfo} />
        ) : (
          <PublicScoutProfile publicUser={user} />
        )}
      </Box>
    </PageContainer>
  );
}

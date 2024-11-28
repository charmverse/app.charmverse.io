import { Paper, Stack } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { Info } from '@packages/scoutgame-ui/components/friends/components/Info';
import { MyFriends } from '@packages/scoutgame-ui/components/friends/components/MyFriends';
import { Stats } from '@packages/scoutgame-ui/components/friends/components/Stats';

import { PageContainer } from 'components/layout/PageContainer';

import { InviteButtons } from './components/InviteButtons';

export async function FriendsPage({ friends }: { friends: SessionUser[] }) {
  return (
    <PageContainer>
      <Stack px={1} gap={3} position='relative' flexDirection={{ xs: 'column', sm: 'row' }}>
        <Paper
          sx={{
            bgcolor: {
              xs: 'transparent',
              md: 'background.dark'
            },
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: {
              xs: 0,
              md: 2
            }
          }}
        >
          <Info />
          <InviteButtons />
          <Stats friends={friends} />
        </Paper>
        <MyFriends friends={friends} />
      </Stack>
    </PageContainer>
  );
}

import { Stack } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { Info } from '@packages/scoutgame-ui/components/friends/components/Info';
import { MyFriends } from '@packages/scoutgame-ui/components/friends/components/MyFriends';
import { Stats } from '@packages/scoutgame-ui/components/friends/components/Stats';

import { InviteButtons } from './components/InviteButtons';

export async function FriendsPage({ friends }: { friends: SessionUser[] }) {
  return (
    <Stack px={1} gap={2} position='relative'>
      <Info />
      <InviteButtons />
      <Stats friends={friends} />
      <MyFriends friends={friends} />
    </Stack>
  );
}

import { Stack } from '@mui/material';
import { getFriends } from '@packages/scoutgame/users/getFriends';

import { getSession } from 'lib/session/getSession';

import { Info } from './components/Info';
import { InviteButtons } from './components/InviteButtons';
import { MyFriends } from './components/MyFriends';
import { Stats } from './components/Stats';

export async function FriendsPage() {
  const session = await getSession();
  const friends = await getFriends(session.scoutId);

  return (
    <Stack px={1} gap={2} position='relative'>
      <Info />
      <InviteButtons />
      <Stats friends={friends} />
      <MyFriends friends={friends} />
    </Stack>
  );
}

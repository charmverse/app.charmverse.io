import { getSession } from '@packages/scoutgame/session/getSession';
import { getFriends } from '@packages/scoutgame/users/getFriends';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { FriendsPage } from 'components/friends/FriendsPage';

export default async function Friends() {
  const session = await getSession();
  const [, friends = []] = await safeAwaitSSRData(getFriends(session.scoutId));

  return <FriendsPage friends={friends} />;
}

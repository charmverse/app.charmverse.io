import { getFriends } from '@packages/scoutgame/users/getFriends';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { FriendsPage } from 'components/friends/FriendsPage';
import { getSession } from 'lib/session/getSession';

export default async function Friends() {
  const session = await getSession();
  const [, friends = []] = await safeAwaitSSRData(getFriends(session.scoutId));

  return <FriendsPage friends={friends} />;
}

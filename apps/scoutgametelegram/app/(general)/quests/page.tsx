import { getDailyClaims } from '@packages/scoutgame/claims/getDailyClaims';
import { getQuests } from '@packages/scoutgame/quests/getQuests';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getFriends } from '@packages/scoutgame/users/getFriends';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import { QuestsPage } from '@packages/scoutgame-ui/components/quests/QuestsPage';

export default async function Quests() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }
  const [, friends = []] = await safeAwaitSSRData(getFriends(user.id));
  const [, dailyClaims = []] = await safeAwaitSSRData(getDailyClaims(user.id));
  const [, quests = []] = await safeAwaitSSRData(getQuests(user.id));
  return <QuestsPage dailyClaims={dailyClaims} quests={quests} friends={friends} />;
}
